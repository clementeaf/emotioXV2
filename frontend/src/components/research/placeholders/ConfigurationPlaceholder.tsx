interface ConfigurationPlaceholderProps {
  researchId: string;
}

export const ConfigurationPlaceholder = ({ researchId }: ConfigurationPlaceholderProps) => (
  <div className="p-6 bg-gray-50 rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Configuration</h2>
    <p className="text-gray-600">Configuration for research {researchId} coming soon...</p>
  </div>
);