import { DemographicQuestion } from './types';

export function DemographicForm({ questions }: { questions: DemographicQuestion[] }) {
  return (
    <form className="w-full max-w-lg mx-auto flex flex-col gap-4">
      {questions.map(q =>
        q.enabled ? (
          <div key={q.key} className="flex flex-col">
            <label className="font-medium mb-1 text-gray-700">{q.key}</label>
            <select
              required={q.required}
              className="p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
            >
              {q.options.map((opt, i) =>
                typeof opt === 'string'
                  ? <option key={i} value={opt}>{opt}</option>
                  : <option key={i} value={opt.value}>{opt.label}</option>
              )}
            </select>
          </div>
        ) : null
      )}
    </form>
  );
}
