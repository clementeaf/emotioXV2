'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface EyeTrackingFormProps {
  researchId: string;
  className?: string;
}

interface EyeTrackingConfig {
  calibration: boolean;
  validation: boolean;
  recordAudio: boolean;
  recordVideo: boolean;
  showGaze: boolean;
  showFixations: boolean;
  showSaccades: boolean;
  showHeatmap: boolean;
  samplingRate: number;
  fixationThreshold: number;
  saccadeVelocityThreshold: number;
}

export function EyeTrackingForm({ researchId, className }: EyeTrackingFormProps) {
  const [config, setConfig] = useState<EyeTrackingConfig>({
    calibration: true,
    validation: true,
    recordAudio: false,
    recordVideo: true,
    showGaze: true,
    showFixations: true,
    showSaccades: true,
    showHeatmap: true,
    samplingRate: 60,
    fixationThreshold: 100,
    saccadeVelocityThreshold: 30
  });

  const handleConfigChange = (key: keyof EyeTrackingConfig, value: boolean | number) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Recording Settings */}
      <section>
        <h2 className="text-lg font-medium mb-4">Recording Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Calibration</span>
              <p className="text-sm text-neutral-500">Enable eye tracking calibration before starting</p>
            </div>
            <Switch
              checked={config.calibration}
              onCheckedChange={(checked: boolean) => handleConfigChange('calibration', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Validation</span>
              <p className="text-sm text-neutral-500">Validate calibration accuracy</p>
            </div>
            <Switch
              checked={config.validation}
              onCheckedChange={(checked: boolean) => handleConfigChange('validation', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Record Audio</span>
              <p className="text-sm text-neutral-500">Record participant's voice during the session</p>
            </div>
            <Switch
              checked={config.recordAudio}
              onCheckedChange={(checked: boolean) => handleConfigChange('recordAudio', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Record Video</span>
              <p className="text-sm text-neutral-500">Record participant's webcam during the session</p>
            </div>
            <Switch
              checked={config.recordVideo}
              onCheckedChange={(checked: boolean) => handleConfigChange('recordVideo', checked)}
            />
          </div>
        </div>
      </section>

      {/* Visualization Settings */}
      <section>
        <h2 className="text-lg font-medium mb-4">Visualization Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Show Gaze</span>
              <p className="text-sm text-neutral-500">Display real-time gaze position</p>
            </div>
            <Switch
              checked={config.showGaze}
              onCheckedChange={(checked: boolean) => handleConfigChange('showGaze', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Show Fixations</span>
              <p className="text-sm text-neutral-500">Highlight fixation points</p>
            </div>
            <Switch
              checked={config.showFixations}
              onCheckedChange={(checked: boolean) => handleConfigChange('showFixations', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Show Saccades</span>
              <p className="text-sm text-neutral-500">Display eye movement paths</p>
            </div>
            <Switch
              checked={config.showSaccades}
              onCheckedChange={(checked: boolean) => handleConfigChange('showSaccades', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Show Heatmap</span>
              <p className="text-sm text-neutral-500">Generate attention heatmap</p>
            </div>
            <Switch
              checked={config.showHeatmap}
              onCheckedChange={(checked: boolean) => handleConfigChange('showHeatmap', checked)}
            />
          </div>
        </div>
      </section>

      {/* Advanced Settings */}
      <section>
        <h2 className="text-lg font-medium mb-4">Advanced Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sampling Rate (Hz)</label>
            <Input
              type="number"
              value={config.samplingRate}
              onChange={(e) => handleConfigChange('samplingRate', parseInt(e.target.value))}
              className="w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fixation Threshold (ms)</label>
            <Input
              type="number"
              value={config.fixationThreshold}
              onChange={(e) => handleConfigChange('fixationThreshold', parseInt(e.target.value))}
              className="w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Saccade Velocity Threshold (°/s)</label>
            <Input
              type="number"
              value={config.saccadeVelocityThreshold}
              onChange={(e) => handleConfigChange('saccadeVelocityThreshold', parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Configuration</Button>
      </div>
    </div>
  );
} 