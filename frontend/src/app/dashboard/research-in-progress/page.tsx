'use client';

import { ParticipantGenerator } from '@/components/research/ParticipantGenerator';
import { ParticipantsTable } from '@/components/research/ParticipantsTable';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useMonitoringReceiver } from '@/hooks/useMonitoringReceiver';
import { researchInProgressAPI, setupAuthToken } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Activity, CheckCircle, Clock, ExternalLink, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

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

function ResearchInProgressContent() {
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research');
  const { token, authLoading } = useAuth();

  console.log('[ResearchInProgress] 🚀 Componente inicializado:', {
    researchId,
    hasToken: !!token,
    authLoading
  });

  // 🎯 MONITOREO EN TIEMPO REAL
  const { isConnected, monitoringData, reconnect } = useMonitoringReceiver(researchId || '');

  console.log('[ResearchInProgress] 📡 Estado del monitoreo:', {
    isConnected,
    hasMonitoringData: !!monitoringData,
    participantsCount: monitoringData?.participants?.length || 0
  });

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
    console.log('[ResearchInProgress] 🔄 useEffect monitoringData:', {
      monitoringData: !!monitoringData,
      researchId,
      monitoringDataResearchId: monitoringData?.researchId,
      participantsCount: monitoringData?.participants?.length || 0,
      isConnected: isConnected
    });

    if (monitoringData && monitoringData.researchId === researchId) {
      console.log('[ResearchInProgress] ✅ Actualizando datos con monitoreo en tiempo real:', {
        totalParticipants: monitoringData.totalParticipants,
        activeParticipants: monitoringData.activeParticipants,
        participants: monitoringData.participants.map(p => ({
          participantId: p.participantId,
          email: p.email,
          status: p.status,
          progress: p.progress
        }))
      });

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

      // 🎯 ACTUALIZAR PARTICIPANTES CON MEJOR MAPEADO
      const updatedParticipants: Participant[] = monitoringData.participants.map(p => ({
        id: p.participantId,
        name: p.email || `Participante ${p.participantId.slice(-6)}`, // Usar email o ID corto como nombre
        email: p.email || 'N/A',
        status: p.status === 'in_progress' ? 'En proceso' :
          p.status === 'completed' ? 'Completado' :
            p.status === 'disqualified' ? 'Descalificado' : 'Por iniciar',
        progress: p.progress || 0,
        duration: p.duration ? `${Math.round(p.duration / 1000)}s` : '--',
        lastActivity: p.lastActivity ? new Date(p.lastActivity).toLocaleString('es-ES') : '--'
      }));

      console.log('[ResearchInProgress] 📊 Participantes actualizados:', updatedParticipants);

      setParticipants(updatedParticipants);
    } else {
      console.log('[ResearchInProgress] ⚠️ No se actualizaron datos:', {
        reason: !monitoringData ? 'No hay monitoringData' :
          monitoringData.researchId !== researchId ? 'researchId no coincide' : 'Desconocido',
        monitoringDataResearchId: monitoringData?.researchId,
        currentResearchId: researchId
      });
    }
  }, [monitoringData, researchId, isConnected]);

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
      {/* 🎯 INDICADOR DE CONEXIÓN WEBSOCKET */}
      <div className="mb-6 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {monitoringData?.participants?.length || 0} participantes monitoreados
          </div>
        </div>
        {!isConnected && (
          <button
            onClick={reconnect}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Reconectar
          </button>
        )}
      </div>

      {/* 🎯 HEADER PRINCIPAL */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investigación en Curso</h1>
          <p className="text-gray-600 mt-2">
            Monitoreo en tiempo real de participantes y progreso
          </p>
        </div>
        <Button onClick={handleOpenPublicTests} variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" />
          Abrir Public Tests
        </Button>
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
          <TabsTrigger value="generator">Generar Participantes</TabsTrigger>
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

        <TabsContent value="generator" className="space-y-4">
          <ParticipantGenerator
            researchId={researchId || ''}
            onParticipantsGenerated={(newParticipants) => {
              // Actualizar la lista de participantes si es necesario
              console.log('Participantes generados:', newParticipants);
            }}
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

export default function ResearchInProgressPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Cargando investigación...</span>
        </div>
      </div>
    }>
      <ResearchInProgressContent />
    </Suspense>
  );
}
