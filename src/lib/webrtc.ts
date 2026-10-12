import { CallSignalPayload, CallType } from '../types';

export interface WebRTCCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onSignal?: (signal: CallSignalPayload) => void;
  onCallEnded?: () => void;
  onError?: (err: Error) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: WebRTCCallbacks;
  private callId: string;
  private currentUserId: string;
  private targetUserId: string;
  private callType: CallType;

  constructor(
    callId: string,
    currentUserId: string,
    targetUserId: string,
    callType: CallType,
    callbacks: WebRTCCallbacks
  ) {
    this.callId = callId;
    this.currentUserId = currentUserId;
    this.targetUserId = targetUserId;
    this.callType = callType;
    this.callbacks = callbacks;
  }

  async startLocalMedia(): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: this.callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.callbacks.onLocalStream?.(this.localStream);
      return this.localStream;
    } catch (err) {
      console.warn('Could not access microphone/camera. Creating fallback simulated stream:', err);
      // Create empty/synthetic canvas audio/video stream so the UI functions even if camera permission is denied
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 480);
      }
      const stream = canvas.captureStream(15);
      this.localStream = stream;
      this.callbacks.onLocalStream?.(this.localStream);
      return this.localStream;
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) return this.peerConnection;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnection = pc;

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.callbacks.onRemoteStream?.(this.remoteStream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onSignal?.({
          type: 'candidate',
          call_id: this.callId,
          caller_id: this.currentUserId,
          target_user_id: this.targetUserId,
          call_type: this.callType,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.callbacks.onCallEnded?.();
      }
    };

    return pc;
  }

  async initiateCall(): Promise<void> {
    await this.startLocalMedia();
    const pc = this.createPeerConnection();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.callbacks.onSignal?.({
      type: 'offer',
      call_id: this.callId,
      caller_id: this.currentUserId,
      target_user_id: this.targetUserId,
      call_type: this.callType,
      sdp: offer,
    });
  }

  async handleOffer(offerSdp: RTCSessionDescriptionInit): Promise<void> {
    await this.startLocalMedia();
    const pc = this.createPeerConnection();

    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.callbacks.onSignal?.({
      type: 'answer',
      call_id: this.callId,
      caller_id: this.currentUserId,
      target_user_id: this.targetUserId,
      call_type: this.callType,
      sdp: answer,
    });
  }

  async handleAnswer(answerSdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
  }

  async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('Error adding ICE candidate:', err);
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.callbacks.onCallEnded?.();
  }
}

/**
 * Web Audio synthesizer for incoming and outgoing ringtones
 */
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playOutgoingRingtone(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    const beep = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } catch {
        // audio context might be blocked
      }
    };

    beep();
    this.intervalId = window.setInterval(beep, 3000);
  }

  playIncomingRingtone(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    const ring = () => {
      try {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.1, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.45);
        });
      } catch {
        // audio context might be blocked
      }
    };

    ring();
    this.intervalId = window.setInterval(ring, 2200);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const ringtoneSynth = new SoundSynthesizer();
