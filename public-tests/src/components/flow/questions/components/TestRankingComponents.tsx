import React from 'react';
import { RankingButton, RankingHeader, RankingList } from './index';

export const TestRankingComponents: React.FC = () => {
    const testItems = ['Item 1', 'Item 2', 'Item 3'];
    const testButtonText = 'Test Button';

    const handleMoveUp = (index: number) => {
        console.log('Move up:', index);
    };

    const handleMoveDown = (index: number) => {
        console.log('Move down:', index);
    };

    const handleButtonClick = () => {
        console.log('Button clicked!');
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full mx-auto">
            <h1 className="text-2xl font-bold text-blue-600 mb-6">🧪 TEST RANKING COMPONENTS</h1>

            <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded">
                <h2 className="text-lg font-bold text-blue-800 mb-2">📋 Test RankingList:</h2>
                <RankingList
                    items={testItems}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isSaving={false}
                    isApiLoading={false}
                    dataLoading={false}
                />
            </div>

            <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded">
                <h2 className="text-lg font-bold text-green-800 mb-2">🔘 Test RankingButton:</h2>
                <RankingButton
                    onClick={handleButtonClick}
                    disabled={false}
                    text={testButtonText}
                />
            </div>

            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded">
                <h2 className="text-lg font-bold text-yellow-800 mb-2">📝 Test RankingHeader:</h2>
                <RankingHeader
                    title="Test Title"
                    description="Test Description"
                    questionText="Test Question Text"
                />
            </div>

            <div className="p-4 bg-red-100 border border-red-300 rounded">
                <h2 className="text-lg font-bold text-red-800 mb-2">⚠️ Test con datos vacíos:</h2>
                <RankingList
                    items={[]}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isSaving={false}
                    isApiLoading={false}
                    dataLoading={false}
                />
                <RankingButton
                    onClick={handleButtonClick}
                    disabled={true}
                    text="Botón Deshabilitado"
                />
            </div>
        </div>
    );
};
