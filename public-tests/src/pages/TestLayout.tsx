import React from 'react';
import { TestLayoutFooter, TestLayoutHeader, TestLayoutMain } from '../components/TestLayout';

const TestLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <TestLayoutHeader />
    <TestLayoutMain />
    <TestLayoutFooter />
  </div>
);

export default TestLayout;
