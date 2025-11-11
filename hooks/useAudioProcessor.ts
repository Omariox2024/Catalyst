
import { useState, useEffect, useCallback, useRef } from 'react';
import { GeneratedAudio, AudioEdits } from '../types';
import { decodeBlobToAudioBuffer, applyEditsToAudioBuffer, encodeAudioBufferToWavBlob } from '../utils/audioUtils';

// Memoize AudioContext to avoid creating multiple instances
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

export const useAudioProcessor = (initialAudio: GeneratedAudio) => {
    const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
    const [editedBuffer, setEditedBuffer] = useState<AudioBuffer | null>(null);
    const [processedUrl, setProcessedUrl] = useState<string>(initialAudio.url);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [edits, setEdits] = useState<AudioEdits>({
        volume: 1,
        fadeIn: 0,
        fadeOut: 0,
        trimStart: 0,
        trimEnd: 0,
    });
    
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    // Decode the initial audio blob into an AudioBuffer
    useEffect(() => {
        const setup = async () => {
            try {
                const context = getAudioContext();
                const buffer = await decodeBlobToAudioBuffer(initialAudio.blob, context);
                setOriginalBuffer(buffer);
                setEditedBuffer(buffer); // Initially, edited is the same as original
                setDuration(buffer.duration);
                setEdits(prev => ({ ...prev, trimEnd: buffer.duration }));
            } catch (error) {
                console.error("Error decoding audio:", error);
            }
        };
        setup();
    }, [initialAudio]);
    
    const play = useCallback(() => {
        if (!editedBuffer || isPlaying) return;
        const context = getAudioContext();
        const source = context.createBufferSource();
        source.buffer = editedBuffer;
        source.connect(context.destination);
        source.start(0);
        source.onended = () => setIsPlaying(false);
        sourceNodeRef.current = source;
        setIsPlaying(true);
    }, [editedBuffer, isPlaying]);

    const stop = useCallback(() => {
        sourceNodeRef.current?.stop();
        setIsPlaying(false);
    }, []);

    const handleUpdateEdits = useCallback((newEdits: Partial<AudioEdits>) => {
        setEdits(prev => ({ ...prev, ...newEdits }));
    }, []);

    const applyEdits = useCallback(async () => {
        if (!originalBuffer) return;
        setIsProcessing(true);
        try {
            const newBuffer = await applyEditsToAudioBuffer(originalBuffer, edits);
            setEditedBuffer(newBuffer);
            const newBlob = encodeAudioBufferToWavBlob(newBuffer);
            URL.revokeObjectURL(processedUrl); // Clean up old URL
            setProcessedUrl(URL.createObjectURL(newBlob));
        } catch (error) {
            console.error("Failed to apply edits:", error);
        } finally {
            setIsProcessing(false);
        }
    }, [originalBuffer, edits, processedUrl]);

    const resetEdits = useCallback(() => {
        if (!originalBuffer) return;
        setEditedBuffer(originalBuffer);
        URL.revokeObjectURL(processedUrl);
        setProcessedUrl(initialAudio.url);
        setEdits({
            volume: 1,
            fadeIn: 0,
            fadeOut: 0,
            trimStart: 0,
            trimEnd: duration,
        });
    }, [originalBuffer, duration, initialAudio.url, processedUrl]);
    
     const getProcessedBlob = useCallback(() => {
        if (!editedBuffer) return null;
        return encodeAudioBufferToWavBlob(editedBuffer);
    }, [editedBuffer]);

    // Cleanup audio resources on unmount
    useEffect(() => {
        return () => {
            stop();
            URL.revokeObjectURL(processedUrl);
        };
    }, [stop, processedUrl]);

    return {
        duration,
        edits,
        handleUpdateEdits,
        applyEdits,
        resetEdits,
        isProcessing,
        processedUrl,
        play,
        stop,
        isPlaying,
        getProcessedBlob,
    };
};
