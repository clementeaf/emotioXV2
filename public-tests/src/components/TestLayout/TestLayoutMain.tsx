import React from 'react';
import TestLayoutRenderer from './TestLayoutRenderer';
import TestLayoutSidebar from './TestLayoutSidebar';

const TestLayoutMain: React.FC = () => {
  return (
    <main className="flex-1 w-full flex flex-col md:flex-row items-stretch px-2 sm:px-4 py-4">
      <TestLayoutSidebar />
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-2xl flex-1 flex flex-col justify-center mx-auto">
        <TestLayoutRenderer />
      </div>
    </main>
  );
};

export default TestLayoutMain;
