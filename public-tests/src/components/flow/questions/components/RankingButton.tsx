import React from 'react';

interface RankingButtonProps {
    onClick: () => void;
    disabled: boolean;
    text: string;
}

export const RankingButton: React.FC<RankingButtonProps> = ({
    onClick,
    disabled,
    text
}) => {
    console.log('[RankingButton] Rendering with:', {
        text,
        disabled,
        hasOnClick: !!onClick
    });

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
        >
            {text}
        </button>
    );
};
