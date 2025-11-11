export interface FormData {
  genre: string;
  mood: string;
  duration: number;
  tempo: number;
  instrumentation: string;
  looping: boolean;
  enableMastering: boolean;
}

export interface GeneratedAudio {
  id: string;
  url: string;
  blob: Blob;
  fileName: string;
  formData: FormData;
  tags?: string[];
}

export interface AudioEdits {
  volume: number; // 0 to 2
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  trimStart: number; // seconds
  trimEnd: number; // seconds
}

export interface Preset extends FormData {
  name: string;
}

export interface User {
  name: string;
  email: string;
}

export interface TranscriptEntry {
  speaker: 'user' | 'model';
  text: string;
}