interface ParticipantsPlaceholderProps {
  researchId: string;
}

export const ParticipantsPlaceholder = ({ researchId }: ParticipantsPlaceholderProps) => (
  <div className="p-6 bg-gray-50 rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Participants Management</h2>
    <p className="text-gray-600">Participants management for research {researchId} coming soon...</p>
  </div>
);