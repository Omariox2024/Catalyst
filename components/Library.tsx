import React from 'react';
import { GeneratedAudio } from '../types';
import { DownloadIcon } from './IconComponents';

interface LibraryProps {
    tracks: GeneratedAudio[];
}

const Library: React.FC<LibraryProps> = ({ tracks }) => {
    if (tracks.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="text-3xl font-bold text-center mb-6 text-slate-300">My Library</h2>
            <div className="bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 space-y-4">
                {tracks.map((track) => (
                    <div key={track.id} className="bg-slate-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-grow w-full">
                            <p className="font-semibold text-slate-200">{track.fileName}</p>
                            <p className="text-xs text-slate-400">
                                {track.formData.genre} | {track.formData.mood} | {track.formData.duration}s
                            </p>
                             {track.tags && track.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {track.tags.map(tag => (
                                        <span key={tag} className="bg-purple-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <audio controls src={track.url} className="w-full mt-3"></audio>
                        </div>
                        <a
                            href={track.url}
                            download={track.fileName}
                            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            <DownloadIcon />
                            Download
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Library;