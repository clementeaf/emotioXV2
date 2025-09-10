'use client';

import { ParticipantGenerator } from '@/components/research/ParticipantGenerator';
import { ParticipantsTable } from '@/components/research/ParticipantsTable';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useMonitoringReceiver } from '@/hooks/useMonitoringReceiver';
import { researchInProgressAPI, setupAuthToken } from '@/config/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { Activity, CheckCircle, Clock, ExternalLink, Info, Users } from 'lucide-react';
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
  const [showInfoModal, setShowInfoModal] = useState(false);


  useEffect(() => {
    const loadData = async () => {
      if (!researchId || authLoading || !token) return;

      // Configurar el token de autenticación
      setupAuthToken();

      setIsLoading(true);
      setError(null);

      try {
        console.log('[Dashboard] 🚀 Cargando datos para research:', researchId);
        console.log('[Dashboard] 🔑 Token disponible:', !!localStorage.getItem('token'));

        const metricsResponse = await researchInProgressAPI.getOverviewMetrics(researchId);
        console.log('[Dashboard] 📊 Respuesta de métricas:', metricsResponse);

        if (metricsResponse?.success && metricsResponse?.data) {
          // 🚨 FIX: Validar que la estructura de datos sea correcta antes de actualizar
          const metricsData = metricsResponse.data as ResearchStatus;
          if (metricsData.status && metricsData.participants && metricsData.completionRate && metricsData.averageTime) {
            setStatus(metricsData);
            console.log('[Dashboard] ✅ Métricas cargadas correctamente');
          } else {
            console.warn('[Dashboard] ⚠️ Estructura de métricas incompleta:', metricsData);
          }
        } else {
          console.warn('[Dashboard] ⚠️ Respuesta de métricas inesperada:', metricsResponse);
          // 🚨 FIX: Si no hay success flag, pero hay datos, validar estructura
          if (metricsResponse && typeof metricsResponse === 'object') {
            const directData = metricsResponse as ResearchStatus;
            if (directData.status && directData.participants && directData.completionRate && directData.averageTime) {
              setStatus(directData);
              console.log('[Dashboard] ✅ Métricas cargadas desde estructura alternativa');
            } else {
              console.warn('[Dashboard] ❌ Estructura de datos inválida:', directData);
            }
          }
        }

        const participantsResponse = await researchInProgressAPI.getParticipantsWithStatus(researchId);
        console.log('[Dashboard] 👥 Respuesta de participantes:', participantsResponse);

        if (participantsResponse.success && participantsResponse.data) {
          // La respuesta viene como { success: true, data: { data: [...], status: 200 } }
          const participantsData = participantsResponse.data.data || [];
          setParticipants(participantsData);
        } else if (participantsResponse.data && Array.isArray(participantsResponse.data)) {
          // Si viene directamente como array
          setParticipants(participantsResponse.data);
        } else {
          // Fallback: buscar datos en cualquier estructura
          const data = participantsResponse?.data?.data || participantsResponse?.data || [];
          setParticipants(Array.isArray(data) ? data : []);
        }
      } catch (error: any) {
        console.error('[Dashboard] ❌ Error cargando datos:', error);
        console.error('[Dashboard] ❌ Error details:', {
          message: error.message,
          status: error.status,
          response: error.response,
          stack: error.stack
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
      setShowInfoModal(true);
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
          <Info className="w-4 h-4 mr-2" />
          Acceso a Tests
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
            <div className="text-2xl font-bold">{status.status?.value || '--'}</div>
            <p className="text-xs text-muted-foreground">{status.status?.description || 'Cargando...'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.participants?.value || '--'}</div>
            <p className="text-xs text-muted-foreground">{status.participants?.description || 'Cargando...'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de completitud</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.completionRate?.value || '--'}</div>
            <p className="text-xs text-muted-foreground">{status.completionRate?.description || 'Cargando...'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.averageTime?.value || '--'}</div>
            <p className="text-xs text-muted-foreground">{status.averageTime?.description || 'Cargando...'}</p>
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
          <div className="flex justify-end items-center">
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
            onParticipantsGenerated={() => {
              // Actualizar la lista de participantes si es necesario
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

      {/* 🎯 MODAL INFORMATIVO SOBRE ACCESO A TESTS */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Acceso a Tests por Participante
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                Cada participante tiene una URL única para acceder a los tests sin necesidad de login.
              </p>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">¿Cómo acceder?</p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Usa la pestaña "Generar Participantes" para crear participantes</li>
                  <li>• En la tabla de participantes, usa los botones de "Acceso directo"</li>
                  <li>• Cada participante tiene su propia URL con su ID incluido</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Formato de URL:</strong><br />
                  <code className="text-xs">
                    http://localhost:5173?researchId=XXX&userId=YYY
                  </code>
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowInfoModal(false)}
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
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
