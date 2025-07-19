'use client';

import { ParticipantsTable } from '@/components/research/ParticipantsTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Activity, CheckCircle, Clock, ExternalLink, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ResearchStatus {
  isActive: boolean;
  participantCount: number;
  completionRate: number;
  averageTime: string;
  lastActivity: string;
  totalResponses: number;
  pendingResponses: number;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'en-proceso' | 'por-iniciar' | 'completado';
  startTime?: string;
  endTime?: string;
  duration?: string;
  progress: number;
  lastActivity: string;
}

export default function ResearchInProgressPage() {
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research');

  const [status, setStatus] = useState<ResearchStatus>({
    isActive: true,
    participantCount: 0,
    completionRate: 0,
    averageTime: '0 min',
    lastActivity: 'Hace 5 minutos',
    totalResponses: 0,
    pendingResponses: 0
  });

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Aquí se cargarían los datos reales desde la API
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus({
          isActive: true,
          participantCount: 12,
          completionRate: 78,
          averageTime: '8 min 32 seg',
          lastActivity: 'Hace 2 minutos',
          totalResponses: 45,
          pendingResponses: 5
        });

        // Datos simulados de participantes
        setParticipants([
          {
            id: '1',
            name: 'María González',
            email: 'maria.gonzalez@email.com',
            status: 'completado',
            startTime: '10:30 AM',
            endTime: '10:45 AM',
            duration: '15 min',
            progress: 100,
            lastActivity: 'Hace 2 horas'
          },
          {
            id: '2',
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@email.com',
            status: 'en-proceso',
            startTime: '11:15 AM',
            duration: '8 min',
            progress: 65,
            lastActivity: 'Hace 5 minutos'
          },
          {
            id: '3',
            name: 'Ana Martínez',
            email: 'ana.martinez@email.com',
            status: 'por-iniciar',
            progress: 0,
            lastActivity: 'No iniciado'
          },
          {
            id: '4',
            name: 'Luis Pérez',
            email: 'luis.perez@email.com',
            status: 'completado',
            startTime: '09:20 AM',
            endTime: '09:35 AM',
            duration: '15 min',
            progress: 100,
            lastActivity: 'Hace 3 horas'
          },
          {
            id: '5',
            name: 'Sofia López',
            email: 'sofia.lopez@email.com',
            status: 'en-proceso',
            startTime: '11:45 AM',
            duration: '12 min',
            progress: 45,
            lastActivity: 'Hace 1 minuto'
          }
        ]);
      } catch (error) {
        console.error('Error loading research data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (researchId) {
      loadData();
    }
  }, [researchId]);

  const handleOpenPublicTests = () => {
    if (researchId) {
      window.open(`http://localhost:5173/?researchId=${researchId}`, '_blank');
    }
  };

  const handleViewParticipantDetails = (participantId: string) => {
    console.log('Ver detalles del participante:', participantId);
    // Aquí se implementaría la lógica para ver detalles
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando estado de la investigación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Investigación en curso</h1>
          <p className="text-neutral-600 mt-1">
            Monitorea el progreso y estado actual de tu investigación
          </p>
        </div>
        <Button onClick={handleOpenPublicTests} className="flex items-center gap-2">
          <ExternalLink size={16} />
          Abrir vista de participante
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="mt-6">
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estado</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Activa
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">
                    Los participantes pueden acceder
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participantes</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.participantCount}</div>
                  <p className="text-xs text-neutral-600">
                    {status.totalResponses} respuestas completadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de completitud</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.completionRate}%</div>
                  <p className="text-xs text-neutral-600">
                    {status.pendingResponses} pendientes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo promedio</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.averageTime}</div>
                  <p className="text-xs text-neutral-600">
                    Última actividad: {status.lastActivity}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Participants Table */}
            <ParticipantsTable
              participants={participants}
              onViewDetails={handleViewParticipantDetails}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Análisis detallado de la investigación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">Contenido de analytics próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>
                Configuración de la investigación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">Configuración próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
