import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Call, CallType, CallStatus, Profile, CallSignalPayload } from '../types';
import { useAuth } from './AuthContext';
import { WebRTCManager, ringtoneSynth } from '../lib/webrtc';
import { getSupabaseClient } from '../lib/supabase';

interface CallContextType {
  activeCall: Call | null;
  incomingCall: Call | null;
  callDuration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  callHistory: Call[];
  startCall: (targetUser: Profile, conversationId: string, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endActiveCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const LOCAL_CALL_HISTORY_KEY = 'pulseflow_call_history';

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const webrtcRef = useRef<WebRTCManager | null>(null);
  const timerRef = useRef<number | null>(null);
  const signalingChannelRef = useRef<BroadcastChannel | null>(null);

  // Load call history from local store
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_CALL_HISTORY_KEY);
      if (stored) {
        setCallHistory(JSON.parse(stored));
      } else {
        // Default seed call history
        const seedCalls: Call[] = [
          {
            id: 'call-1',
            conversation_id: 'conv-elena-alex',
            caller_id: 'user-pulse-2',
            call_type: 'video',
            status: 'ended',
            started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            ended_at: new Date(Date.now() - 3600000 * 5 + 60000 * 14).toISOString(),
            caller: {
              id: 'user-pulse-2',
              username: 'elena_rostova',
              display_name: 'Elena Rostova',
              avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
              last_seen: new Date().toISOString(),
              is_online: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
          {
            id: 'call-2',
            conversation_id: 'conv-marcus-alex',
            caller_id: 'user-pulse-1',
            call_type: 'voice',
            status: 'ended',
            started_at: new Date(Date.now() - 3600000 * 28).toISOString(),
            ended_at: new Date(Date.now() - 3600000 * 28 + 60000 * 3).toISOString(),
            is_outgoing: true,
            receiver: {
              id: 'user-pulse-3',
              username: 'marcus_vance',
              display_name: 'Marcus Vance',
              avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
              last_seen: new Date().toISOString(),
              is_online: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        ];
        setCallHistory(seedCalls);
        localStorage.setItem(LOCAL_CALL_HISTORY_KEY, JSON.stringify(seedCalls));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveCallToHistory = useCallback((call: Call) => {
    setCallHistory((prev) => {
      const updated = [call, ...prev];
      try {
        localStorage.setItem(LOCAL_CALL_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Save to Supabase if available
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('calls').insert({
        id: call.id,
        conversation_id: call.conversation_id,
        caller_id: call.caller_id,
        call_type: call.call_type,
        status: call.status,
        started_at: call.started_at,
        ended_at: call.ended_at,
      }).then(() => {});
    }
  }, []);

  // Listen to signaling broadcast
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('pulseflow_calling');
    signalingChannelRef.current = channel;

    channel.onmessage = async (event) => {
      const signal = event.data as CallSignalPayload;
      if (!signal || signal.caller_id === currentUser?.id) return;

      if (signal.target_user_id === currentUser?.id) {
        if (signal.type === 'offer') {
          // Incoming call!
          const incoming: Call = {
            id: signal.call_id,
            conversation_id: 'conv-incoming',
            caller_id: signal.caller_id,
            call_type: signal.call_type,
            status: 'ringing',
            started_at: new Date().toISOString(),
            caller: {
              id: signal.caller_id,
              username: 'Incoming Caller',
              display_name: 'Contact Calling...',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              last_seen: new Date().toISOString(),
              is_online: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          };
          setIncomingCall(incoming);
          ringtoneSynth.playIncomingRingtone();
        } else if (signal.type === 'answer' && signal.sdp) {
          ringtoneSynth.stop();
          if (webrtcRef.current) {
            await webrtcRef.current.handleAnswer(signal.sdp);
            setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (webrtcRef.current) {
            await webrtcRef.current.handleCandidate(signal.candidate);
          }
        } else if (signal.type === 'end') {
          endActiveCall();
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [currentUser]);

  // Duration timer
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      timerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall?.status]);

  const startCall = async (targetUser: Profile, conversationId: string, type: CallType) => {
    if (!currentUser) return;
    ringtoneSynth.playOutgoingRingtone();

    const callId = `call-${Date.now()}`;
    const newCall: Call = {
      id: callId,
      conversation_id: conversationId,
      caller_id: currentUser.id,
      call_type: type,
      status: 'calling',
      started_at: new Date().toISOString(),
      receiver: targetUser,
      is_outgoing: true,
    };

    setActiveCall(newCall);
    setIsVideoEnabled(type === 'video');

    const manager = new WebRTCManager(callId, currentUser.id, targetUser.id, type, {
      onLocalStream: (s) => setLocalStream(s),
      onRemoteStream: (s) => setRemoteStream(s),
      onSignal: (sig) => {
        signalingChannelRef.current?.postMessage(sig);
      },
      onCallEnded: () => {
        endActiveCall();
      },
    });

    webrtcRef.current = manager;
    await manager.initiateCall();

    // Auto connect simulation if peer is in local sandbox
    setTimeout(() => {
      setActiveCall((prev) => {
        if (prev && prev.status === 'calling') {
          ringtoneSynth.stop();
          return { ...prev, status: 'connected' };
        }
        return prev;
      });
    }, 3500);
  };

  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;
    ringtoneSynth.stop();

    const ongoingCall: Call = {
      ...incomingCall,
      status: 'connected',
    };

    setIncomingCall(null);
    setActiveCall(ongoingCall);
    setIsVideoEnabled(incomingCall.call_type === 'video');

    const manager = new WebRTCManager(
      incomingCall.id,
      currentUser.id,
      incomingCall.caller_id,
      incomingCall.call_type,
      {
        onLocalStream: (s) => setLocalStream(s),
        onRemoteStream: (s) => setRemoteStream(s),
        onSignal: (sig) => signalingChannelRef.current?.postMessage(sig),
        onCallEnded: () => endActiveCall(),
      }
    );

    webrtcRef.current = manager;
    await manager.startLocalMedia();
  };

  const declineCall = () => {
    ringtoneSynth.stop();
    if (incomingCall) {
      signalingChannelRef.current?.postMessage({
        type: 'end',
        call_id: incomingCall.id,
        caller_id: incomingCall.caller_id,
        target_user_id: incomingCall.caller_id,
        call_type: incomingCall.call_type,
      });
      saveCallToHistory({
        ...incomingCall,
        status: 'declined',
        ended_at: new Date().toISOString(),
      });
    }
    setIncomingCall(null);
  };

  const endActiveCall = () => {
    ringtoneSynth.stop();
    if (webrtcRef.current) {
      webrtcRef.current.endCall();
      webrtcRef.current = null;
    }

    if (activeCall) {
      signalingChannelRef.current?.postMessage({
        type: 'end',
        call_id: activeCall.id,
        caller_id: activeCall.caller_id,
        target_user_id: activeCall.receiver?.id || '',
        call_type: activeCall.call_type,
      });

      saveCallToHistory({
        ...activeCall,
        status: 'ended',
        ended_at: new Date().toISOString(),
      });
    }

    setActiveCall(null);
    setIncomingCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    webrtcRef.current?.toggleAudio(!next);
  };

  const toggleVideo = () => {
    const next = !isVideoEnabled;
    setIsVideoEnabled(next);
    webrtcRef.current?.toggleVideo(next);
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callDuration,
        isMuted,
        isVideoEnabled,
        callHistory,
        startCall,
        acceptCall,
        declineCall,
        endActiveCall,
        toggleMute,
        toggleVideo,
        localStream,
        remoteStream,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
