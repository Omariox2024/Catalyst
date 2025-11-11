
import React from 'react';
import { User } from '../types';
import { UserIcon, LogoutIcon } from './IconComponents';

interface HeaderProps {
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout }) => {
    return (
        <header className="flex justify-between items-center mb-8">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 pb-2">
                    Catalyst
                </h1>
                <p className="text-slate-400 text-sm sm:text-base">AI Soundtrack Generator</p>
            </div>
            <div>
                {user ? (
                    <div className="flex items-center gap-4">
                        <span className="text-slate-300 hidden sm:inline">Welcome, {user.name}</span>
                        <button onClick={onLogout} className="flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            <LogoutIcon />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                         <button onClick={onLogin} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            <UserIcon />
                            <span className="hidden sm:inline">Login</span>
                        </button>
                        <button onClick={onLogin} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors hidden sm:block">
                            Sign Up
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
