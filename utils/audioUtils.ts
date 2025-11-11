import { AudioEdits } from '../types';

// Helper to write strings into a DataView for the WAV header
const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

/**
 * Creates a WAV file Blob from raw PCM audio data (base64 encoded).
 * The Gemini TTS API returns raw audio, so we need to wrap it in a WAV header.
 */
export const createWavBlobFromPcmBase64 = (base64: string): Blob => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const pcmData = new Int16Array(bytes.buffer);
    const sampleRate = 24000; // Gemini TTS default sample rate
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = pcmData.length * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    // FIX: Corrected a typo where `new a(buffer)` was used instead of `new DataView(buffer)`.
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Audio format 1 for PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }

    return new Blob([view], { type: 'audio/wav' });
};

/**
 * Decodes a Blob (like a WAV file) into an AudioBuffer for use with Web Audio API.
 */
export const decodeBlobToAudioBuffer = async (blob: Blob, audioContext: AudioContext): Promise<AudioBuffer> => {
    const arrayBuffer = await blob.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
};

/**
 * Encodes an AudioBuffer into a WAV file Blob.
 */
export const encodeAudioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: 'audio/wav' });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
};


/**
 * Applies edits (trim, fades, volume) to an AudioBuffer using an OfflineAudioContext.
 * This function processes the audio non-destructively and returns a new, edited AudioBuffer.
 */
export const applyEditsToAudioBuffer = async (
    originalBuffer: AudioBuffer,
    edits: AudioEdits
): Promise<AudioBuffer> => {
    const { trimStart, trimEnd, fadeIn, fadeOut, volume } = edits;
    
    // Validate trim and fade values
    const safeTrimStart = Math.max(0, trimStart);
    const safeTrimEnd = Math.min(originalBuffer.duration, trimEnd);
    const newDuration = safeTrimEnd - safeTrimStart;
    
    if (newDuration <= 0) {
        throw new Error("Invalid trim range. End time must be after start time.");
    }
    
    const safeFadeIn = Math.min(fadeIn, newDuration / 2);
    const safeFadeOut = Math.min(fadeOut, newDuration / 2);

    const offlineContext = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        newDuration * originalBuffer.sampleRate,
        originalBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = originalBuffer;

    const gainNode = offlineContext.createGain();
    gainNode.gain.setValueAtTime(0, 0);

    // Apply fades and volume
    const peakVolume = volume;
    gainNode.gain.linearRampToValueAtTime(peakVolume, safeFadeIn);
    gainNode.gain.setValueAtTime(peakVolume, newDuration - safeFadeOut);
    gainNode.gain.linearRampToValueAtTime(0, newDuration);
    
    source.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    // Start playing the source at the trim start offset for the duration of the new clip
    source.start(0, safeTrimStart, newDuration);
    
    return await offlineContext.startRendering();
};

// --- Utilities for Live API ---

/**
 * Encodes a Uint8Array into a Base64 string.
 */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string into a Uint8Array.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 * The Gemini Live API returns raw PCM, not a standard audio file format.
 */
export async function decodePcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}