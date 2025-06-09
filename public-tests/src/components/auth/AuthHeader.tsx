import React from 'react';
import { AuthHeaderProps } from '../../types/flow.types';

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, emoji = '😀' }) => {
    return (
        <div className="flex flex-col items-center mb-8">
            <span className="bg-yellow-400 text-black rounded-full w-12 h-12 flex items-center justify-center text-2xl mb-4">
                {emoji}
            </span>
            <span className="text-2xl font-semibold text-neutral-900">
                {title}
            </span>
        </div>
    );
}; 