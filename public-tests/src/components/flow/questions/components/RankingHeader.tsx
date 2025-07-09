import React from 'react';

interface RankingHeaderProps {
    title: string;
    description?: string;
    questionText?: string;
}

export const RankingHeader: React.FC<RankingHeaderProps> = ({
    title,
    description,
    questionText
}) => {
    return (
        <>
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            {questionText && <p className="text-neutral-600 mb-4">{questionText}</p>}
        </>
    );
};
