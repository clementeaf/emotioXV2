import { memo } from 'react';
import { ClientInfo } from './ClientInfo';

interface ClientData {
  id: string;
  name: string;
}

interface ClientInfoSectionProps {
  client: ClientData | null;
}

export const ClientInfoSection = memo(({ client }: ClientInfoSectionProps) => (
  <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-6">
    <h2 className="text-base font-medium text-neutral-900 mb-4">
      {client ? `Who is ${client.name}` : 'Who is'}
    </h2>
    <ClientInfo />
  </div>
));

ClientInfoSection.displayName = 'ClientInfoSection';
