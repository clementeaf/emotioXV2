'use client';

import React from 'react';

interface CognitiveTaskHeaderProps {
  title: string;
}

export function CognitiveTaskHeader({ title }: CognitiveTaskHeaderProps) {
  return (
    <div className="p-5 border-b border-neutral-200">
      <h2 className="text-xl font-semibold text-neutral-800">{title}</h2>
    </div>
  );
} 