import React, { useRef, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Shield } from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const CallOverlay: React.FC = () => {
  const {
    activeCall,
    incomingCall,
    callDuration,
    isMuted,
    isVideoEnabled,
    acceptCall,
    declineCall,
    endActiveCall,
    toggleMute,
    toggleVideo,
    localStream,
    remoteStream,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach media streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.call_type]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.call_type]);

  const formatCallTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // 1. INCOMING CALL MODAL
  if (incomingCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center text-white shadow-2xl flex flex-col items-center">
          <div className="relative mb-4">
            <span className="absolute -inset-2 rounded-full bg-teal-500/20 animate-ping" />
            <Avatar
              src={incomingCall.caller?.avatar_url}
              name={incomingCall.caller?.display_name || 'Caller'}
              size="2xl"
            />
          </div>

          <h3 className="text-lg font-bold">
            {incomingCall.caller?.display_name || 'Incoming Call'}
          </h3>
          <p className="text-xs text-teal-400 font-medium mt-1 animate-pulse flex items-center justify-center gap-1.5">
            <Volume2 className="w-4 h-4" />
            PulseFlow {incomingCall.call_type === 'video' ? 'Video' : 'Voice'} Call Ringing...
          </p>

          <div className="flex items-center gap-6 mt-8">
            {/* Decline */}
            <button
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/50 transition cursor-pointer hover:scale-105 active:scale-95"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Accept */}
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 transition cursor-pointer hover:scale-105 active:scale-95"
              title="Accept"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE / ONGOING CALL OVERLAY
  if (!activeCall) return null;

  const targetPerson = activeCall.receiver || activeCall.caller;
  const isVideo = activeCall.call_type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 select-none animate-in fade-in duration-200">
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
        {/* Remote media view (or animated audio pulse) */}
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
          {isVideo && isVideoEnabled ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="relative mb-6">
                <span className="absolute -inset-4 rounded-full bg-teal-500/10 animate-pulse" />
                <Avatar
                  src={targetPerson?.avatar_url}
                  name={targetPerson?.display_name || 'Contact'}
                  size="2xl"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {targetPerson?.display_name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono">
                <Shield className="w-3.5 h-3.5" />
                End-to-End P2P WebRTC Connected
              </div>
            </div>
          )}
        </div>

        {/* Local video PiP */}
        {isVideo && (
          <div className="absolute top-20 right-4 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden bg-black/60 border border-slate-700 shadow-2xl z-20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}

        {/* Top Header Bar */}
        <div className="relative z-20 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar src={targetPerson?.avatar_url} name={targetPerson?.display_name} size="sm" />
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">
                {targetPerson?.display_name}
              </h4>
              <p className="text-xs text-teal-300 font-mono">
                {activeCall.status === 'calling' ? 'Calling...' : formatCallTime(callDuration)}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="relative z-20 p-8 flex items-center justify-center gap-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call */}
          <button
            onClick={endActiveCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-950/80 transition cursor-pointer hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Video Toggle */}
          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`w-13 h-13 rounded-full flex items-center justify-center transition cursor-pointer ${
                !isVideoEnabled
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isVideoEnabled ? 'Disable Camera' : 'Enable Camera'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
