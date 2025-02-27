'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface RecruitConfigurationProps {
  className?: string;
}

interface DemographicConfig {
  age: boolean;
  country: boolean;
  gender: boolean;
  educationLevel: boolean;
  annualIncome: boolean;
  employmentStatus: boolean;
  dailyHoursOnline: boolean;
  technicalProficiency: boolean;
}

interface LinkConfig {
  completeInterviews: string;
  disqualifiedInterviews: string;
  overquotaInterviews: string;
}

interface ResearchConfig {
  researchUrl: string;
  participantLimit: number;
}

interface Statistics {
  complete: number;
  disqualified: number;
  overquota: number;
}

export function RecruitConfiguration({ className }: RecruitConfigurationProps) {
  const [demographicEnabled, setDemographicEnabled] = useState(true);
  const [linkConfigEnabled, setLinkConfigEnabled] = useState(true);
  const [limitParticipantsEnabled, setLimitParticipantsEnabled] = useState(true);
  const [allowMobileDevices, setAllowMobileDevices] = useState(true);
  const [trackLocation, setTrackLocation] = useState(true);
  const [participantLimit, setParticipantLimit] = useState(50);

  const [demographics, setDemographics] = useState<DemographicConfig>({
    age: true,
    country: true,
    gender: true,
    educationLevel: true,
    annualIncome: true,
    employmentStatus: true,
    dailyHoursOnline: true,
    technicalProficiency: true,
  });

  const [linkConfig, setLinkConfig] = useState<LinkConfig>({
    completeInterviews: '',
    disqualifiedInterviews: '',
    overquotaInterviews: '',
  });

  const [researchConfig, setResearchConfig] = useState<ResearchConfig>({
    researchUrl: '',
    participantLimit: 50,
  });

  const [statistics] = useState<Statistics>({
    complete: 57,
    disqualified: 24,
    overquota: 15,
  });

  const handleDemographicChange = (key: keyof DemographicConfig) => {
    setDemographics(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLinkChange = (key: keyof LinkConfig, value: string) => {
    setLinkConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResearchConfigChange = (key: keyof ResearchConfig, value: string | number) => {
    setResearchConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className={cn("p-6 space-y-8", className)}>
      {/* Recruitment link section */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-medium mb-6">Recruitment link</h2>
          
          {/* Demographic questions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">Demographic questions</span>
              <Switch 
                checked={demographicEnabled}
                onCheckedChange={setDemographicEnabled}
              />
            </div>
            
            {demographicEnabled && (
              <div className="space-y-3 pl-4">
                {Object.entries(demographics).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleDemographicChange(key as keyof DemographicConfig)}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Link configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Link configuration</span>
                <Switch 
                  checked={linkConfigEnabled}
                  onCheckedChange={setLinkConfigEnabled}
                />
              </div>
              {linkConfigEnabled && (
                <div className="space-y-3 pl-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowMobileDevices}
                      onChange={() => setAllowMobileDevices(!allowMobileDevices)}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm">Allow respondents to take survey via mobile devices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={trackLocation}
                      onChange={() => setTrackLocation(!trackLocation)}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm">Track respondents location</span>
                  </div>
                  <div className="text-xs text-neutral-500 pl-6">
                    It can be taken multiple times within a single session
                  </div>
                </div>
              )}
            </div>

            {/* Limit participants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Limit number of participants</span>
                <Switch 
                  checked={limitParticipantsEnabled}
                  onCheckedChange={setLimitParticipantsEnabled}
                />
              </div>
              {limitParticipantsEnabled && (
                <div className="pl-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={participantLimit}
                      onChange={(e) => setParticipantLimit(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-neutral-600">
                      You will receive {participantLimit} responses
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Research configuration */}
        <div>
          <h2 className="text-lg font-medium mb-6">Research configuration</h2>
          
          {/* Backlinks */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium mb-4">A. Backlinks</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Link for complete interviews</label>
                  <Input
                    value={linkConfig.completeInterviews}
                    onChange={(e) => handleLinkChange('completeInterviews', e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Link for disqualified interviews</label>
                  <Input
                    value={linkConfig.disqualifiedInterviews}
                    onChange={(e) => handleLinkChange('disqualifiedInterviews', e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Link for overquota interviews</label>
                  <Input
                    value={linkConfig.overquotaInterviews}
                    onChange={(e) => handleLinkChange('overquotaInterviews', e.target.value)}
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>

            {/* Research link */}
            <div>
              <h3 className="text-base font-medium mb-4">B. Research's link to share</h3>
              <div className="space-y-2">
                <p className="text-sm text-neutral-600">
                  Third-party invitation system should substitute [your respondent id here]
                </p>
                <div>
                  <label className="block text-sm mb-2">Research URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={researchConfig.researchUrl}
                      onChange={(e) => handleResearchConfigChange('researchUrl', e.target.value)}
                      placeholder="https://"
                    />
                    <Button variant="outline">Link Preview</Button>
                    <Button>Generate QR</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Parameters */}
            <div>
              <h3 className="text-base font-medium mb-4">C. Research's parameters to save</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Parameters</Button>
                <Button size="sm" variant="outline">Separated</Button>
                <Button size="sm" variant="outline">With</Button>
                <Button size="sm" variant="outline">Comma</Button>
                <Button size="sm" variant="outline">Keys</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-500 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Complete</h3>
              <p className="text-xs opacity-80">238 IDs have been successful</p>
            </div>
            <span className="text-2xl font-semibold">57%</span>
          </div>
          <div className="mt-2 bg-white/20 rounded-full h-1">
            <div className="bg-white h-1 rounded-full" style={{ width: '57%' }} />
          </div>
        </div>
        <div className="bg-yellow-500 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Disqualified</h3>
              <p className="text-xs opacity-80">94 IDs have been rejected</p>
            </div>
            <span className="text-2xl font-semibold">24%</span>
          </div>
          <div className="mt-2 bg-white/20 rounded-full h-1">
            <div className="bg-white h-1 rounded-full" style={{ width: '24%' }} />
          </div>
        </div>
        <div className="bg-red-500 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Overquota</h3>
              <p className="text-xs opacity-80">25 IDs have been redirected</p>
            </div>
            <span className="text-2xl font-semibold">15%</span>
          </div>
          <div className="mt-2 bg-white/20 rounded-full h-1">
            <div className="bg-white h-1 rounded-full" style={{ width: '15%' }} />
          </div>
        </div>
      </div>
    </div>
  );
} 