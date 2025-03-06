'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface QuotasFormProps {
  className?: string;
}

interface Quota {
  id: string;
  name: string;
  type: 'demographic' | 'custom';
  attribute: string;
  values: QuotaValue[];
  enabled: boolean;
}

interface QuotaValue {
  id: string;
  label: string;
  target: number;
  current: number;
}

export function QuotasForm({ className }: QuotasFormProps) {
  const [quotasEnabled, setQuotasEnabled] = useState(true);
  const [quotaLimitType, setQuotaLimitType] = useState<'soft' | 'hard'>('soft');
  const [totalLimit, setTotalLimit] = useState(500);
  
  const [quotas, setQuotas] = useState<Quota[]>([
    {
      id: 'gender',
      name: 'Gender Distribution',
      type: 'demographic',
      attribute: 'gender',
      enabled: true,
      values: [
        { id: 'male', label: 'Male', target: 250, current: 125 },
        { id: 'female', label: 'Female', target: 250, current: 97 },
        { id: 'non-binary', label: 'Non-binary', target: 0, current: 5 }
      ]
    },
    {
      id: 'age',
      name: 'Age Groups',
      type: 'demographic',
      attribute: 'age',
      enabled: true,
      values: [
        { id: '18-24', label: '18-24', target: 100, current: 45 },
        { id: '25-34', label: '25-34', target: 150, current: 78 },
        { id: '35-44', label: '35-44', target: 150, current: 56 },
        { id: '45-54', label: '45-54', target: 100, current: 32 }
      ]
    },
    {
      id: 'location',
      name: 'Geographic Location',
      type: 'demographic',
      attribute: 'country',
      enabled: false,
      values: [
        { id: 'us', label: 'United States', target: 300, current: 145 },
        { id: 'uk', label: 'United Kingdom', target: 100, current: 56 },
        { id: 'ca', label: 'Canada', target: 100, current: 23 }
      ]
    }
  ]);

  const calculateQuotaProgress = (quota: Quota) => {
    const total = quota.values.reduce((sum, value) => sum + value.target, 0);
    const current = quota.values.reduce((sum, value) => sum + value.current, 0);
    return total > 0 ? Math.floor((current / total) * 100) : 0;
  };

  const calculateTotalProgress = () => {
    const enabledQuotas = quotas.filter(q => q.enabled);
    if (enabledQuotas.length === 0) return 0;
    
    return Math.floor(
      enabledQuotas.reduce((sum, quota) => sum + calculateQuotaProgress(quota), 0) / enabledQuotas.length
    );
  };

  const updateQuotaTarget = (quotaId: string, valueId: string, target: number) => {
    setQuotas(quotas.map(quota => 
      quota.id === quotaId 
        ? {
            ...quota, 
            values: quota.values.map(value => 
              value.id === valueId 
                ? { ...value, target } 
                : value
            )
          } 
        : quota
    ));
  };

  const toggleQuotaEnabled = (quotaId: string) => {
    setQuotas(quotas.map(quota => 
      quota.id === quotaId ? { ...quota, enabled: !quota.enabled } : quota
    ));
  };

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900">
              2.3 - Quota Management
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Set quotas to control the demographic distribution of your research participants.
            </p>
          </header>

          <div className="space-y-6">
            {/* Main quota switch */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium text-neutral-900">Enable Quotas</h3>
                <p className="text-sm text-neutral-500">Control the demographic distribution of your participants.</p>
              </div>
              <Switch 
                checked={quotasEnabled}
                onCheckedChange={setQuotasEnabled}
              />
            </div>

            {quotasEnabled && (
              <>
                {/* Quota limit type */}
                <div className="p-4 border rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">Quota Limit Type</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="soft-limit"
                        name="quota-limit-type"
                        checked={quotaLimitType === 'soft'}
                        onChange={() => setQuotaLimitType('soft')}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="soft-limit" className="text-sm">
                        Soft limit (Allow overquota, but redirect to different survey)
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="hard-limit"
                        name="quota-limit-type"
                        checked={quotaLimitType === 'hard'}
                        onChange={() => setQuotaLimitType('hard')}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="hard-limit" className="text-sm">
                        Hard limit (Reject participants once quota is reached)
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-neutral-50 rounded border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="total-participant-limit" className="text-sm font-medium">
                        Total participant limit
                      </label>
                      <Input
                        id="total-participant-limit"
                        type="number"
                        value={totalLimit}
                        onChange={(e) => setTotalLimit(Number(e.target.value))}
                        className="w-24 text-right"
                      />
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${calculateTotalProgress()}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>0</span>
                      <span>{calculateTotalProgress()}% complete</span>
                      <span>{totalLimit}</span>
                    </div>
                  </div>
                </div>

                {/* Quotas list */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-neutral-900">Configured Quotas</h3>
                  
                  {quotas.map((quota) => (
                    <div 
                      key={quota.id} 
                      className={cn(
                        "border rounded-lg overflow-hidden",
                        quota.enabled ? "border-neutral-200" : "border-neutral-200 bg-neutral-50"
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <h3 className={cn(
                              "text-sm font-medium",
                              quota.enabled ? "text-neutral-900" : "text-neutral-500"
                            )}>
                              {quota.name}
                            </h3>
                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                              {quota.type}
                            </span>
                          </div>
                          <Switch 
                            checked={quota.enabled}
                            onCheckedChange={() => toggleQuotaEnabled(quota.id)}
                          />
                        </div>
                        
                        {quota.enabled && (
                          <div className="mt-3 space-y-4">
                            <table className="w-full text-sm">
                              <thead className="text-xs text-neutral-500 border-b">
                                <tr>
                                  <th className="pb-2 font-medium text-left">Category</th>
                                  <th className="pb-2 font-medium text-center">Current</th>
                                  <th className="pb-2 font-medium text-center">Target</th>
                                  <th className="pb-2 font-medium text-right">Progress</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                {quota.values.map((value) => (
                                  <tr key={value.id}>
                                    <td className="py-2">{value.label}</td>
                                    <td className="py-2 text-center">{value.current}</td>
                                    <td className="py-2 text-center">
                                      <Input
                                        type="number"
                                        value={value.target}
                                        onChange={(e) => updateQuotaTarget(quota.id, value.id, Number(e.target.value))}
                                        className="w-16 text-center mx-auto"
                                      />
                                    </td>
                                    <td className="py-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <div className="w-16 bg-neutral-200 rounded-full h-1.5">
                                          <div 
                                            className="bg-blue-500 h-1.5 rounded-full" 
                                            style={{ width: `${value.target > 0 ? Math.min(100, Math.floor((value.current / value.target) * 100)) : 0}%` }} 
                                          />
                                        </div>
                                        <span className="text-xs text-neutral-500">
                                          {value.target > 0 ? Math.floor((value.current / value.target) * 100) : 0}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="flex justify-end">
                              <Button size="sm" variant="outline">Edit Categories</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <Button variant="outline" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add New Quota
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">Changes are saved automatically</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Reset Quotas
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save and Continue
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
} 