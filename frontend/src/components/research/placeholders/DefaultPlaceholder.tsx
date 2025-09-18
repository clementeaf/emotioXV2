interface DefaultPlaceholderProps {
  researchId: string;
}

export const DefaultPlaceholder = ({ researchId }: DefaultPlaceholderProps) => (
  <div className="p-6 bg-gray-50 rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Research Configuration</h2>
    <p className="text-gray-600">Configuration for research {researchId} coming soon...</p>
  </div>
);