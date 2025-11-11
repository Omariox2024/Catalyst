
import React from 'react';
import { DownloadIcon } from './IconComponents';

interface AudioPlayerProps {
    src: string;
    fileName: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, fileName }) => {
    return (
        <div className="bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 space-y-4 animate-fade-in">
            <audio controls src={src} className="w-full">
                Your browser does not support the audio element.
            </audio>
            <a
                href={src}
                download={fileName}
                className="w-full flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-cyan-500/50"
            >
                <DownloadIcon />
                Download Track (.wav)
            </a>
        </div>
    );
};

export default AudioPlayer;
