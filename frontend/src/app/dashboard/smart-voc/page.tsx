'use client';

import React from 'react';
import { QuickAccess } from '@/components/research/SmartVOC/QuickAccess';

/**
 * Página principal de Smart VOC
 * Muestra acceso rápido al sistema genérico
 */
export default function SmartVOCPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <QuickAccess />
      </div>
    </div>
  );
}
