import React from 'react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { Company } from '../../../../shared/interfaces/company.interface';

interface BasicInfoStepProps {
  formData: {
    name: string;
    companyId: string;
  };
  errors: Record<string, string>;
  companies: Company[];
  loadingCompanies: boolean;
  companiesError: string | null;
  onFieldChange: (field: string, value: string) => void;
  enterpriseSelectRef: React.RefObject<HTMLSelectElement>;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  errors,
  companies,
  loadingCompanies,
  companiesError,
  onFieldChange,
  enterpriseSelectRef
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Name the Research</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Please, name the research project and assign it to an existing client or create a new one
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-neutral-900">
              Research's name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Project 001"
              error={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="companyId" className="block text-sm font-medium text-neutral-900">
              It&apos;s made for
            </label>
            <select
              id="companyId"
              ref={enterpriseSelectRef}
              value={formData.companyId}
              onChange={(e) => onFieldChange('companyId', e.target.value)}
              disabled={loadingCompanies}
              className={cn(
                'w-full px-3 py-2 rounded-lg border bg-white text-neutral-900',
                errors.companyId ? 'border-red-500' : 'border-neutral-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                loadingCompanies && 'opacity-50 cursor-not-allowed'
              )}
            >
              <option value="">{loadingCompanies ? 'Loading companies...' : 'Select a company'}</option>
              {companies.filter(company => company.status === 'active').map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {companiesError && !loadingCompanies && (
              <p className="text-sm text-yellow-600">
                ⚠️ Could not load companies from server. Using fallback options.
              </p>
            )}
            {errors.companyId && (
              <p className="text-sm text-red-500">{errors.companyId}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};