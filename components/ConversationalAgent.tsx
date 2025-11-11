import React, { useRef, useEffect } from 'react';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { MicrophoneIcon, StopIcon, UserIcon, ChatBubbleIcon } from './IconComponents';

const ConversationalAgent: React.FC = () => {
    const { status, transcript, startConversation, endConversation, realtimeInput, error } = useLiveConversation();
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, realtimeInput]);
    
    const statusMessages = {
        idle: 'Ready to start. Press the microphone to begin.',
        connecting: 'Connecting to the AI...',
        listening: 'Listening... Speak now.',
        error: error || 'An error occurred. Please try again.',
        stopped: 'Conversation ended. Press start to go again.',
    };

    return (
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 flex flex-col h-[70vh] max-h-[600px]">
            {/* Transcript Area */}
            <div className="flex-grow bg-slate-900/50 rounded-lg p-4 overflow-y-auto mb-4 space-y-4">
                {status === 'error' ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 text-center">
                        <p className="font-semibold text-lg mb-2">Connection Failed</p>
                        <p className="text-sm">
                            {error || 'An unexpected error occurred. Please check your connection and microphone permissions, then try again.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {transcript.length === 0 && !realtimeInput && (
                             <div className="flex items-center justify-center h-full text-slate-400">
                                Your conversation will appear here.
                            </div>
                        )}
                        {transcript.map((entry, index) => (
                            <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                                {entry.speaker === 'model' && (
                                     <div className="flex-shrink-0 bg-purple-500 h-8 w-8 rounded-full flex items-center justify-center">
                                        <ChatBubbleIcon />
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                    <p className="text-sm">{entry.text}</p>
                                </div>
                                {entry.speaker === 'user' && (
                                     <div className="flex-shrink-0 bg-slate-600 h-8 w-8 rounded-full flex items-center justify-center">
                                        <UserIcon />
                                    </div>
                                )}
                            </div>
                        ))}
                        {realtimeInput && (
                            <div className="flex items-start gap-3 justify-end">
                                <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-blue-600 text-white opacity-75">
                                    <p className="text-sm italic">{realtimeInput}</p>
                                </div>
                                <div className="flex-shrink-0 bg-slate-600 h-8 w-8 rounded-full flex items-center justify-center">
                                    <UserIcon />
                                </div>
                            </div>
                        )}
                         <div ref={transcriptEndRef} />
                    </>
                )}
            </div>

            {/* Status & Controls */}
            <div className="flex-shrink-0 text-center">
                <p className={`text-sm mb-4 h-5 ${status === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                    {statusMessages[status]}
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={startConversation}
                        disabled={status === 'connecting' || status === 'listening'}
                        className="flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg"
                        aria-label="Start conversation"
                    >
                        <MicrophoneIcon /> Start
                    </button>
                    <button
                        onClick={() => endConversation()}
                        disabled={status !== 'listening' && status !== 'connecting'}
                        className="flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg"
                        aria-label="End conversation"
                    >
                        <StopIcon /> End
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConversationalAgent;