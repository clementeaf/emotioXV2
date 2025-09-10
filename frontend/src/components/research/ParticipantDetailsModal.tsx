'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  X
} from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface ParticipantResponse {
  questionKey: string;
  questionText: string;
  response: any;
  timestamp: string;
  duration?: number;
}

interface ParticipantDetails {
  id: string;
  name: string;
  email: string;
  status: string;
  progress: number;
  startTime?: string;
  endTime?: string;
  totalDuration?: number;
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
    screenSize: string;
  };
  location?: {
    country: string;
    city: string;
    ip: string;
  };
  responses?: ParticipantResponse[];
  disqualificationReason?: string;
  isDisqualified: boolean;
}

interface ParticipantDetailsModalProps {
  participant: ParticipantDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const deviceConfig = {
  desktop: { icon: Monitor, label: 'Desktop', color: 'bg-blue-100 text-blue-800' },
  mobile: { icon: Smartphone, label: 'Móvil', color: 'bg-green-100 text-green-800' },
  tablet: { icon: Tablet, label: 'Tablet', color: 'bg-purple-100 text-purple-800' }
};

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

export function ParticipantDetailsModal({ participant, isOpen, onClose }: ParticipantDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'timeline'>('overview');

  if (!isOpen || !participant) return null;

  // 🎯 DEBUG: Log participant data
  console.log('[ParticipantDetailsModal] 📊 Participant data received:', participant);
  console.log('[ParticipantDetailsModal] 📝 Responses count:', participant.responses?.length || 0);
  console.log('[ParticipantDetailsModal] 📝 Responses data:', participant.responses);

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['Por iniciar'];
  };

  const getDeviceConfig = (deviceType: string) => {
    return deviceConfig[deviceType as keyof typeof deviceConfig] || deviceConfig.desktop;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 🎯 FUNCIÓN PARA FORMATEAR RESPUESTAS DE FORMA LEGIBLE
  const formatResponse = (response: any): string => {
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'number') {
      return response.toString();
    }

    if (typeof response === 'object' && response !== null) {
      // Casos especiales para tipos de respuesta conocidos
      if (response.gender && response.country && response.age) {
        return `Género: ${response.gender} • País: ${response.country} • Edad: ${response.age}`;
      }

      if (response.selectedValue) {
        return `Selección: ${response.selectedValue}`;
      }

      if (response.value !== undefined) {
        return `Valor: ${response.value}`;
      }

      if (response.visited !== undefined) {
        return response.visited ? 'Visitado' : 'No visitado';
      }

      if (response.selectedHitzone && response.clickPosition) {
        return `Zona seleccionada: ${response.selectedHitzone} • Posición: (${response.clickPosition.x}, ${response.clickPosition.y})`;
      }

      if (response.imageSelections) {
        const selections = Object.keys(response.imageSelections).length;
        return `${selections} imagen(es) seleccionada(s)`;
      }

      // Para otros objetos, mostrar solo los valores principales
      const mainValues = Object.entries(response)
        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join(' • ');

      return mainValues || 'Sin datos específicos';
    }

    return 'Sin respuesta';
  };

  return createPortal(
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-white/90 backdrop-blur-sm rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Detalles del Participante
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              {participant.name} • {participant.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0 hover:bg-neutral-200 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 bg-white/50 backdrop-blur-sm">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'responses'
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
            >
              Respuestas ({participant.responses?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'timeline'
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
            >
              Cronología
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-white/30 backdrop-blur-sm">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status and Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const status = getStatusConfig(participant.status);
                      const StatusIcon = status.icon;
                      return (
                        <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Progreso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${participant.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-neutral-600">{participant.progress}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Duración Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">
                      {participant.totalDuration ? formatDuration(participant.totalDuration) : '--'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Device and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participant.deviceInfo && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Dispositivo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(() => {
                          const device = getDeviceConfig(participant.deviceInfo.type);
                          const DeviceIcon = device.icon;
                          return (
                            <Badge className={`${device.color} flex items-center gap-1 w-fit`}>
                              <DeviceIcon className="h-3 w-3" />
                              {device.label}
                            </Badge>
                          );
                        })()}
                        <div className="text-sm text-neutral-600">
                          <div>{participant.deviceInfo.browser}</div>
                          <div>{participant.deviceInfo.os}</div>
                          <div>{participant.deviceInfo.screenSize}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {participant.location && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Ubicación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-neutral-500" />
                          <span className="text-sm font-medium">
                            {participant.location.city}, {participant.location.country}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          IP: {participant.location.ip}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cronología</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {participant.startTime && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Inicio de participación</div>
                          <div className="text-xs text-neutral-500">
                            {formatTimestamp(participant.startTime)}
                          </div>
                        </div>
                      </div>
                    )}

                    {participant.endTime && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Finalización</div>
                          <div className="text-xs text-neutral-500">
                            {formatTimestamp(participant.endTime)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Disqualification */}
              {participant.isDisqualified && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Descalificado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-red-700">
                      {participant.disqualificationReason || 'Razón no especificada'}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'responses' && (
            <div className="space-y-4">
              {!participant.responses || participant.responses.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No hay respuestas registradas</p>
                </div>
              ) : (
                participant.responses.map((response, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {response.questionText}
                      </CardTitle>
                      <div className="text-xs text-neutral-500">
                        {formatTimestamp(response.timestamp)}
                        {response.duration && ` • ${formatDuration(response.duration)}`}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-neutral-700">
                        {formatResponse(response.response)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200"></div>
                <div className="space-y-6">
                  {participant.responses?.map((response, index) => (
                    <div key={index} className="relative pl-8">
                      <div className="absolute left-0 top-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-sm font-medium">{response.questionText}</div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {formatTimestamp(response.timestamp)}
                          {response.duration && ` • ${formatDuration(response.duration)}`}
                        </div>
                        <div className="text-sm text-neutral-700 mt-2">
                          {formatResponse(response.response)}
                        </div>
                      </div>
                    </div>
                  )) || (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <p className="text-neutral-600">No hay respuestas registradas</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
