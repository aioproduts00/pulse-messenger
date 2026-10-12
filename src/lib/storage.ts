import { getSupabaseClient } from './supabase';

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
}

/**
 * Uploads a file either to Supabase Storage or creates a persistent client Blob/Data URL
 */
export async function uploadMediaFile(
  file: File,
  bucket: 'chat-attachments' | 'avatars' | 'status-media' = 'chat-attachments',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const supabase = getSupabaseClient();
  const fileExt = file.name.split('.').pop() || 'bin';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${bucket}/${fileName}`;

  onProgress?.(25);

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!error && data) {
        onProgress?.(80);
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        onProgress?.(100);
        return {
          url: publicUrlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        };
      }
      console.warn('Supabase storage upload failed, falling back to local encoding:', error?.message);
    } catch (err) {
      console.warn('Supabase storage exception, falling back to local encoding:', err);
    }
  }

  // Fallback: Read as Data URL with compression for images if necessary
  onProgress?.(60);
  const dataUrl = await readFileAsDataURL(file);
  onProgress?.(100);

  return {
    url: dataUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Audio recorder helper using HTML5 MediaRecorder
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime = 0;

  async start(): Promise<void> {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.startTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  async stop(): Promise<{ blob: Blob; duration: number; file: File }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: mimeType });

        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        resolve({ blob, duration, file });
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}
