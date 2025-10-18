import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../commons';
import type { Company } from '../../../types/api.types';

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
  onCompanyCreated?: (newCompany: { id: string; name: string }) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  errors,
  companies,
  loadingCompanies,
  companiesError,
  onFieldChange,
  onCompanyCreated
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
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Project 001"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Cannot continue</p>
                  <p className="text-sm text-red-700">{errors.name}. Please choose a different name to proceed to the next step.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="companyId" className="block text-sm font-medium text-neutral-900">
              It's made for
            </label>
            <select
              id="companyId"
              value={formData.companyId}
              onChange={(e) => onFieldChange('companyId', e.target.value)}
              disabled={loadingCompanies}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.companyId ? 'border-red-500' : 'border-gray-300'
              } ${loadingCompanies ? 'bg-gray-100' : 'bg-white'}`}
            >
              <option value="">
                {loadingCompanies ? 'Loading companies...' : 'Select or create a company'}
              </option>
              {companies
                .filter(company => company.status === 'active')
                .map(company => (
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
