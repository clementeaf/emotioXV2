import React from 'react';
import { RankingButton, RankingHeader, RankingList } from './index';

export const SimpleRankingTest: React.FC = () => {
    console.log('[SimpleRankingTest] Rendering test component');

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full mx-auto">
            <h1 className="text-2xl font-bold text-blue-600 mb-6">🧪 SIMPLE RANKING TEST</h1>

            <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">📋 RankingList Test:</h2>
                <RankingList
                    items={['Opción A', 'Opción B', 'Opción C']}
                    onMoveUp={(index) => console.log('Move up:', index)}
                    onMoveDown={(index) => console.log('Move down:', index)}
                    isSaving={false}
                    isApiLoading={false}
                    dataLoading={false}
                />
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">🔘 RankingButton Test:</h2>
                <RankingButton
                    onClick={() => console.log('Button clicked!')}
                    disabled={false}
                    text="Test Button"
                />
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">📝 RankingHeader Test:</h2>
                <RankingHeader
                    title="Test Title"
                    description="Test Description"
                    questionText="Test Question"
                />
            </div>
        </div>
    );
};
