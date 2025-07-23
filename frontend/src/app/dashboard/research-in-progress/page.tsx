'use client';

import { ParticipantsTable } from '@/components/research/ParticipantsTable';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useMonitoringReceiver } from '@/hooks/useMonitoringReceiver';
import { researchInProgressAPI, setupAuthToken } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Activity, CheckCircle, Clock, ExternalLink, Users, Wifi, WifiOff } from 'lucide-react';
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

  // 🎯 MONITOREO EN TIEMPO REAL
  const { isConnected, monitoringData, reconnect } = useMonitoringReceiver(researchId || '');

  const [status, setStatus] = useState<ResearchStatus>({
    status: { value: '--', description: 'Cargando...', icon: 'chart-line' },
    participants: { value: '--', description: 'Cargando...', icon: 'users' },
    completionRate: { value: '--', description: 'Cargando...', icon: 'check-circle' },
    averageTime: { value: '--', description: 'Cargando...', icon: 'clock' }
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 ACTUALIZAR DATOS CON MONITOREO EN TIEMPO REAL
  useEffect(() => {
    if (monitoringData && monitoringData.researchId === researchId) {
      // 🎯 ACTUALIZAR ESTADÍSTICAS
      setStatus(prev => ({
        ...prev,
        participants: {
          value: monitoringData.totalParticipants.toString(),
          description: `${monitoringData.activeParticipants} activos`,
          icon: 'users'
        },
        completionRate: {
          value: `${Math.round(monitoringData.averageProgress)}%`,
          description: `${monitoringData.completedParticipants} completados`,
          icon: 'check-circle'
        }
      }));

      // 🎯 ACTUALIZAR PARTICIPANTES
      const updatedParticipants: Participant[] = monitoringData.participants.map(p => ({
        id: p.participantId,
        name: p.participantId,
        email: p.email || 'N/A',
        status: p.status,
        progress: p.progress,
        duration: p.duration ? `${Math.round(p.duration / 1000)}s` : '--',
        lastActivity: p.lastActivity
      }));

      setParticipants(updatedParticipants);
    }
  }, [monitoringData, researchId]);

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

  // 🎯 FUNCIÓN PARA MANEJAR ELIMINACIÓN DE PARTICIPANTE
  const handleParticipantDeleted = (participantId: string) => {
    // 🎯 ACTUALIZAR LISTA DE PARTICIPANTES
    setParticipants(prev => prev.filter(p => p.id !== participantId));

    // 🎯 ACTUALIZAR ESTADÍSTICAS
    setStatus(prev => ({
      ...prev,
      participants: {
        value: (participants.length - 1).toString(),
        description: `${Math.max(0, participants.filter(p => p.status === 'in_progress').length - 1)} activos`,
        icon: 'users'
      }
    }));
  };

  const handleOpenPublicTests = () => {
    if (researchId) {
      const publicTestsUrl = `${process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL || 'http://localhost:5173'}?research=${researchId}`;
      window.open(publicTestsUrl, '_blank');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 🎯 HEADER CON ESTADO DE CONEXIÓN */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investigación en curso</h1>
          <p className="text-gray-600 mt-2">Monitorea el progreso y estado actual de tu investigación</p>
        </div>

        {/* 🎯 INDICADOR DE CONEXIÓN WEBSOCKET */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Monitoreo en vivo</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Sin conexión</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="ml-2"
                >
                  Reconectar
                </Button>
              </>
            )}
          </div>

          <Button
            onClick={handleOpenPublicTests}
            className="bg-black text-white hover:bg-gray-800"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir vista de participante
          </Button>
        </div>
      </div>

      {/* 🎯 TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.status.value}</div>
            <p className="text-xs text-muted-foreground">{status.status.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.participants.value}</div>
            <p className="text-xs text-muted-foreground">{status.participants.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de completitud</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.completionRate.value}</div>
            <p className="text-xs text-muted-foreground">{status.completionRate.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.averageTime.value}</div>
            <p className="text-xs text-muted-foreground">{status.averageTime.description}</p>
          </CardContent>
        </Card>
      </div>

      {/* 🎯 TABS PRINCIPALES */}
      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="configuration">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Participantes ({participants.length})</h2>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>

          <ParticipantsTable
            participants={participants}
            onViewDetails={() => { }}
            researchId={researchId || ''}
            onParticipantDeleted={handleParticipantDeleted}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Análisis detallado de la investigación</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Contenido de analytics próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de la investigación en curso</CardTitle>
              <CardDescription>Gestiona la configuración de tu investigación activa</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configuración próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
