'use client';

import { useState } from 'react';

import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface ParticipantsFormProps {
  className?: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'completed' | 'disqualified';
  completedAt?: string;
}

export function ParticipantsForm({ className }: ParticipantsFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Datos de ejemplo
  const [participants] = useState<Participant[]>([
    { id: '001', name: 'John Doe', email: 'john.doe@example.com', status: 'completed', completedAt: '2023-06-15' },
    { id: '002', name: 'Jane Smith', email: 'jane.smith@example.com', status: 'pending' },
    { id: '003', name: 'Robert Johnson', email: 'robert.j@example.com', status: 'disqualified', completedAt: '2023-06-12' },
    { id: '004', name: 'Emily Davis', email: 'emily.d@example.com', status: 'completed', completedAt: '2023-06-14' },
    { id: '005', name: 'Michael Brown', email: 'michael.b@example.com', status: 'pending' },
    { id: '006', name: 'Sarah Wilson', email: 'sarah.w@example.com', status: 'completed', completedAt: '2023-06-10' },
    { id: '007', name: 'David Miller', email: 'david.m@example.com', status: 'disqualified', completedAt: '2023-06-13' },
    { id: '008', name: 'Lisa Taylor', email: 'lisa.t@example.com', status: 'pending' },
  ]);

  // Filtrar participantes basado en la búsqueda y el estado seleccionado
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch =
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.id.includes(searchTerm);

    const matchesStatus = selectedStatus === 'all' || participant.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Función para obtener la clase de color basada en el estado
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-blue-600 bg-blue-50';
      case 'disqualified':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  return (
    <div className={cn('max-w-3xl mx-auto', className)}>
      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900">
              2.0 - Participants Management
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage research participants, view their status, and export data.
            </p>
          </header>

          <div className="space-y-6">
            {/* Search and filter */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <span className="block text-sm text-neutral-500 mb-1">Total</span>
                <span className="text-xl font-semibold">{participants.length}</span>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <span className="block text-sm text-green-600 mb-1">Completed</span>
                <span className="text-xl font-semibold text-green-700">
                  {participants.filter(p => p.status === 'completed').length}
                </span>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <span className="block text-sm text-blue-600 mb-1">Pending</span>
                <span className="text-xl font-semibold text-blue-700">
                  {participants.filter(p => p.status === 'pending').length}
                </span>
              </div>
            </div>

            {/* Participants list */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3">{participant.id}</td>
                        <td className="px-4 py-3">{participant.name}</td>
                        <td className="px-4 py-3">{participant.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(participant.status)}`}>
                            {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="text-neutral-600 hover:text-neutral-800 text-xs"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                        No participants found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - simplificado para este ejemplo */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-neutral-500">
                Showing <span className="font-medium">{filteredParticipants.length}</span> of <span className="font-medium">{participants.length}</span> participants
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled
                  className="px-3 py-1 text-sm rounded-md border border-neutral-200 bg-white text-neutral-400 cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">Última actualización: 15 Jun 2023</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Export CSV
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Invite Participants
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
