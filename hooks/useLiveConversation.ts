import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob as GenaiBlob } from '@google/genai';
import { TranscriptEntry } from '../types';
import { encodeBase64, decodeBase64, decodePcmToAudioBuffer } from '../utils/audioUtils';

type ConversationStatus = "idle" | "connecting" | "listening" | "error" | "stopped";

// Memoize AudioContexts to avoid creating multiple instances
let inputAudioContext: AudioContext | null = null;
const getInputAudioContext = () => {
    if (!inputAudioContext) {
        inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    return inputAudioContext;
};

let outputAudioContext: AudioContext | null = null;
const getOutputAudioContext = () => {
     if (!outputAudioContext) {
        outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return outputAudioContext;
}

export const useLiveConversation = () => {
    const [status, setStatus] = useState<ConversationStatus>("idle");
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [realtimeInput, setRealtimeInput] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    const startConversation = useCallback(async () => {
        if (status !== "idle" && status !== "stopped" && status !== "error") return;
        
        setStatus("connecting");
        setError(null);
        setTranscript([]);
        setRealtimeInput('');
        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            // Scheduling helper for smooth audio playback
            let nextStartTime = 0;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const inputCtx = getInputAudioContext();
                        const outputCtx = getOutputAudioContext();
                        if (inputCtx.state === 'suspended') inputCtx.resume();
                        if (outputCtx.state === 'suspended') outputCtx.resume();

                        setStatus("listening");
                        
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: GenaiBlob = {
                                data: encodeBase64(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcriptions
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                            setRealtimeInput(currentInputTranscription);
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscription.trim();
                            const fullOutput = currentOutputTranscription.trim();
                            
                            setTranscript(prev => {
                                const newTranscript = [...prev];
                                if (fullInput) newTranscript.push({ speaker: 'user', text: fullInput });
                                if (fullOutput) newTranscript.push({ speaker: 'model', text: fullOutput });
                                return newTranscript;
                            });

                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                            setRealtimeInput('');
                        }
                        
                        // Handle audio playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const outputCtx = getOutputAudioContext();
                            nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
                            
                            const audioBuffer = await decodePcmToAudioBuffer(decodeBase64(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                            });

                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                        
                        // Handle interruptions
                        if (message.serverContent?.interrupted) {
                            for (const source of audioSourcesRef.current.values()) {
                                source.stop();
                            }
                            audioSourcesRef.current.clear();
                            nextStartTime = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error("Live session error:", e);
                        setError("A live connection error occurred. The session has been closed.");
                        setStatus("error");
                        endConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        endConversation(true); // End without changing status from component
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });
            
            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            console.error("Failed to start conversation:", err);
            setError(err instanceof Error ? err.message : "Could not start the session. Please check microphone permissions and try again.");
            setStatus("error");
        }
    }, [status]);
    
    const endConversation = useCallback((calledFromOnClose = false) => {
        if (!calledFromOnClose) {
            sessionPromiseRef.current?.then(session => session.close());
        }
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        for (const source of audioSourcesRef.current.values()) {
            source.stop();
        }
        audioSourcesRef.current.clear();
        
        sessionPromiseRef.current = null;
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;

        if (!calledFromOnClose && status !== 'error') {
            setStatus("stopped");
        }
        setRealtimeInput('');

    }, [status]);

    return { status, transcript, startConversation, endConversation, realtimeInput, error };
};