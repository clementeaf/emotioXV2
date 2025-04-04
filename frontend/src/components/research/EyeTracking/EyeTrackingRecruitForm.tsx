'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface EyeTrackingRecruitFormProps {
  researchId: string;
  className?: string;
}

export function EyeTrackingRecruitForm({ researchId, className }: EyeTrackingRecruitFormProps) {
  const [formData, setFormData] = useState({
    recruitmentLink: `https://emotiox.com/eye-tracking/${researchId}`,
    projectName: "Estudio de usabilidad",
    participantEmail: "",
    completedInterviews: 0,
    requiredInterviews: 20,
    notesTemplate: "Gracias por participar en nuestro estudio. Por favor, sigue las instrucciones a continuación...",
    qrEnabled: true
  });

  const [showQRCode, setShowQRCode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(formData.recruitmentLink);
    setIsCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const sendInvitationEmail = () => {
    if (!formData.participantEmail.trim()) {
      toast.error('Por favor, ingresa un correo electrónico válido');
      return;
    }
    
    // Simulación de envío de email
    toast.success(`Invitación enviada a ${formData.participantEmail}`);
    setFormData(prev => ({
      ...prev,
      participantEmail: ""
    }));
  };

  const progressPercent = Math.min(Math.round((formData.completedInterviews / formData.requiredInterviews) * 100), 100);

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900">
              Eye Tracking - Configuración de Reclutamiento
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure el proceso de reclutamiento para estudios de Eye Tracking
            </p>
          </header>

          <div className="space-y-8">
            {/* Recruitment link section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-base font-medium mb-4">Enlace de reclutamiento</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm mb-2">Nombre del proyecto</label>
                    <Input
                      value={formData.projectName}
                      onChange={(e) => handleInputChange('projectName', e.target.value)}
                      placeholder="Nombre del proyecto"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Enlace para participantes</label>
                    <div className="flex">
                      <Input
                        value={formData.recruitmentLink}
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button 
                        onClick={copyLinkToClipboard}
                        className={`rounded-l-none px-3 ${isCopied ? 'bg-green-500' : 'bg-blue-500'}`}
                      >
                        {isCopied ? 'Copiado' : 'Copiar'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.qrEnabled}
                      onCheckedChange={(checked) => handleInputChange('qrEnabled', checked)}
                    />
                    <span className="text-sm">Habilitar código QR</span>
                  </div>
                  
                  {formData.qrEnabled && (
                    <div className="flex flex-col items-center justify-center gap-4 p-4 bg-neutral-50 rounded-lg min-h-[200px]">
                      <div className="bg-white p-4 rounded-lg mb-2">
                        <div className="w-[150px] h-[150px] bg-neutral-200 flex items-center justify-center">
                          <span className="text-neutral-600 text-sm">Código QR</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowQRCode(true)}
                      >
                        Descargar QR
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-base font-medium mb-4">Envío de invitaciones</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm mb-2">Correo electrónico del participante</label>
                    <div className="flex">
                      <Input
                        value={formData.participantEmail}
                        onChange={(e) => handleInputChange('participantEmail', e.target.value)}
                        placeholder="ejemplo@mail.com"
                        className="rounded-r-none"
                      />
                      <Button 
                        onClick={sendInvitationEmail}
                        className="rounded-l-none"
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Plantilla de notas</label>
                    <Textarea
                      value={formData.notesTemplate}
                      onChange={(e) => handleInputChange('notesTemplate', e.target.value)}
                      placeholder="Instrucciones para el participante"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-base font-medium mb-4">Progreso del estudio</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Entrevistas completadas: {formData.completedInterviews}</span>
                  <span>Meta: {formData.requiredInterviews}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInputChange('completedInterviews', Math.max(0, formData.completedInterviews - 1))}
                    >
                      -
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInputChange('completedInterviews', formData.completedInterviews + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {progressPercent}% completado
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">Los cambios se guardan automáticamente</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
            >
              Previsualizar
            </Button>
            <Button>
              Guardar y continuar
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
} 