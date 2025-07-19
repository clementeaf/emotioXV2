'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity, AlertCircle, CheckCircle, Clock, ExternalLink, Users } from 'lucide-react';
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

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const loadStatus = async () => {
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
      } catch (error) {
        console.error('Error loading research status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (researchId) {
      loadStatus();
    }
  }, [researchId]);

  const handleOpenPublicTests = () => {
    if (researchId) {
      window.open(`http://localhost:5173/?researchId=${researchId}`, '_blank');
    }
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

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad reciente
            </CardTitle>
            <CardDescription>
              Últimas interacciones con la investigación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Nuevo participante</span>
                </div>
                <span className="text-xs text-neutral-500">Hace 2 min</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Respuesta completada</span>
                </div>
                <span className="text-xs text-neutral-500">Hace 5 min</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">Participante en progreso</span>
                </div>
                <span className="text-xs text-neutral-500">Hace 8 min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Acciones rápidas
            </CardTitle>
            <CardDescription>
              Gestiona tu investigación desde aquí
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver respuestas en tiempo real
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Exportar datos
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <Clock className="h-4 w-4 mr-2" />
              Pausar investigación
            </Button>

            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              Finalizar investigación
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
