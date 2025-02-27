'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

interface ClientSelectorProps {
  className?: string;
  onClientChange?: (clientId: string) => void;
}

export function ClientSelector({ className, onClientChange }: ClientSelectorProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');

  // Mock data - En producción esto vendría de una API
  const clients: Client[] = [
    { id: '1', name: 'Universidad del Desarrollo', status: 'active' },
    { id: '2', name: 'Cliente Demo', status: 'active' },
  ];

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    onClientChange?.(clientId);
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <h2 className="text-base font-medium text-neutral-900">Change client</h2>
      <div className="relative">
        <select
          value={selectedClient}
          onChange={handleClientChange}
          className="h-9 w-[200px] appearance-none rounded-lg bg-neutral-50 px-3 pr-8 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-200"
        >
          <option value="" disabled>Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
          <svg className="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
} 