'use client';

import { ParticipantsTable } from '@/components/research/ParticipantsTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { researchInProgressAPI, setupAuthToken } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Activity, CheckCircle, Clock, ExternalLink, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ResearchStatus {
  status: {
    value: string;
    description: string;
    icon: string;
  };
  participants: {
    value: string;
    description: string;
    icon: string;
  };
  completionRate: {
    value: string;
    description: string;
    icon: string;
  };
  averageTime: {
    value: string;
    description: string;
    icon: string;
  };
}

interface Participant {
  id: string;
  name: string;
  email: string;
  status: string;
  progress: number;
  duration: string;
  lastActivity: string;
}

export default function ResearchInProgressPage() {
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research');
  const { token, authLoading } = useAuth();

  const [status, setStatus] = useState<ResearchStatus>({
    status: { value: '--', description: 'Cargando...', icon: 'chart-line' },
    participants: { value: '--', description: 'Cargando...', icon: 'users' },
    completionRate: { value: '--', description: 'Cargando...', icon: 'check-circle' },
    averageTime: { value: '--', description: 'Cargando...', icon: 'clock' }
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!researchId || authLoading || !token) return;

      // Configurar el token de autenticación
      setupAuthToken();

      setIsLoading(true);
      setError(null);

      try {
        const metricsResponse = await researchInProgressAPI.getOverviewMetrics(researchId);

        if (metricsResponse.success) {
          setStatus(metricsResponse.data);
        }

        const participantsResponse = await researchInProgressAPI.getParticipantsWithStatus(researchId);

        if (participantsResponse.success) {
          setParticipants(participantsResponse.data || []);
        } else {
          console.error('Error en la respuesta de participantes:', participantsResponse);
        }
      } catch (error: any) {
        console.error('Error loading research data:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setError(error.message || 'Error al cargar los datos de la investigación');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [researchId, token, authLoading]);

  const handleOpenPublicTests = () => {
    if (researchId) {
      window.open(`http://localhost:5173/?researchId=${researchId}`, '_blank');
    }
  };



  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 font-medium">No autorizado</p>
          <p className="text-neutral-600 text-sm mt-1">Debes iniciar sesión para ver esta página</p>
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 font-medium">Error al cargar datos</p>
          <p className="text-neutral-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
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
                      {status.status.value}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">
                    {status.status.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participantes</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.participants.value}</div>
                  <p className="text-xs text-neutral-600 mt-1">
                    {status.participants.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de completitud</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{status.completionRate.value}</div>
                  <p className="text-xs text-neutral-600 mt-1">
                    {status.completionRate.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo promedio</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.averageTime.value}</div>
                  <p className="text-xs text-neutral-600 mt-1">
                    {status.averageTime.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Participants Table */}
            {researchId && (
              <ParticipantsTable
                participants={participants}
                onViewDetails={() => { }}
                researchId={researchId}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Análisis detallado del progreso de la investigación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Contenido de analytics en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>
                Configuración de la investigación en curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Configuración en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
