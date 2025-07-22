'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { researchInProgressAPI } from '@/lib/api';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Search,
  Trash2
} from 'lucide-react';
import { useState } from 'react';
import { ParticipantDetailsModal } from './ParticipantDetailsModal';

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
  researchId: string;
  onParticipantDeleted?: (participantId: string) => void;
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

export function ParticipantsTable({
  participants,
  onViewDetails,
  researchId,
  onParticipantDeleted
}: ParticipantsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [participantDetails, setParticipantDetails] = useState<any>(null);

  // 🎯 ESTADOS PARA ELIMINACIÓN
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['Por iniciar'];
  };

  const handleParticipantClick = async (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);

    try {
      const response = await researchInProgressAPI.getParticipantDetails(researchId, participant.id);

      if (response.success) {
        setParticipantDetails(response.data);
      } else {
        console.error('Error al cargar detalles:', response);
      }
    } catch (error) {
      console.error('Error al cargar detalles del participante:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParticipant(null);
    setParticipantDetails(null);
  };

  // 🎯 FUNCIÓN PARA ABRIR MODAL DE ELIMINACIÓN
  const handleDeleteClick = (participant: Participant) => {
    setParticipantToDelete(participant);
    setIsDeleteModalOpen(true);
  };

  // 🎯 FUNCIÓN PARA ELIMINAR PARTICIPANTE
  const handleDeleteParticipant = async () => {
    if (!participantToDelete) return;

    setIsDeleting(true);

    try {
      const response = await researchInProgressAPI.deleteParticipant(researchId, participantToDelete.id);

      if (response.success) {
        console.log('✅ Participante eliminado exitosamente');

        // 🎯 NOTIFICAR AL COMPONENTE PADRE
        onParticipantDeleted?.(participantToDelete.id);

        // 🎯 CERRAR MODAL
        setIsDeleteModalOpen(false);
        setParticipantToDelete(null);
      } else {
        console.error('❌ Error eliminando participante:', response);
        alert('Error al eliminar participante');
      }
    } catch (error) {
      console.error('❌ Error eliminando participante:', error);
      alert('Error al eliminar participante');
    } finally {
      setIsDeleting(false);
    }
  };

  // 🎯 FUNCIÓN PARA CERRAR MODAL DE ELIMINACIÓN
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setParticipantToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Participantes ({participants.length})
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="En proceso">En proceso</option>
              <option value="Por iniciar">Por iniciar</option>
              <option value="Completado">Completado</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Participante</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Progreso</th>
                  <th className="text-left py-3 px-4 font-medium">Duración</th>
                  <th className="text-left py-3 px-4 font-medium">Última actividad</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant) => {
                  const status = getStatusConfig(participant.status);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={participant.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-sm text-gray-500">{participant.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${participant.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{participant.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{participant.duration}</td>
                      <td className="py-3 px-4 text-gray-600">{participant.lastActivity}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleParticipantClick(participant)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(participant)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 MODAL DE DETALLES */}
      {selectedParticipant && (
        <ParticipantDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          participant={selectedParticipant}
          details={participantDetails}
        />
      )}

      {/* 🎯 MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {isDeleteModalOpen && participantToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Eliminar participante
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar a <strong>{participantToDelete.name}</strong> ({participantToDelete.email})?
            </p>

            <p className="text-sm text-red-600 mb-6">
              ⚠️ Esta acción no se puede deshacer. Se eliminarán todos los datos del participante.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteParticipant}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
