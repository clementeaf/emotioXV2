'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  MoreHorizontal,
  Search
} from 'lucide-react';
import { useState } from 'react';

interface Participant {
  id: string;
  name: string;
  email: string;
  status: string;
  progress: number;
  duration: string;
  lastActivity: string;
}

interface ParticipantsTableProps {
  participants: Participant[];
  onViewDetails: (participantId: string) => void;
}

const statusConfig = {
  'En proceso': {
    label: 'En proceso',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock
  },
  'Por iniciar': {
    label: 'Por iniciar',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle
  },
  'Completado': {
    label: 'Completado',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  }
};

export function ParticipantsTable({ participants, onViewDetails }: ParticipantsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['Por iniciar'];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Participantes ({participants.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar participantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="En proceso">En proceso</option>
            <option value="Por iniciar">Por iniciar</option>
            <option value="Completado">Completado</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Participante</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Progreso</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Duración</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Última actividad</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => {
                const status = getStatusConfig(participant.status);
                const StatusIcon = status.icon;

                return (
                  <tr key={participant.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-neutral-900">{participant.name}</div>
                        <div className="text-sm text-neutral-500">{participant.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${participant.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-neutral-600">{participant.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {participant.duration || '--'}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {participant.lastActivity}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(participant.id)}
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredParticipants.length === 0 && (
          <div className="text-center py-8">
            <div className="text-neutral-500 mb-2">No se encontraron participantes</div>
            <div className="text-sm text-neutral-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay participantes registrados'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
