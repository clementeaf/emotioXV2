'use client';

import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface ThankYouScreenFormProps {
  className?: string;
}

export function ThankYouScreenForm({ className }: ThankYouScreenFormProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <header>
        <h1 className="text-lg font-semibold text-neutral-900">
          4.0 - Thank you screen
        </h1>
        <p className="text-sm text-neutral-500">
          Configure the final screen that participants will see after completing the research.
        </p>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-medium text-neutral-900">Enable Thank You Screen</h2>
            <p className="text-sm text-neutral-500">Show a thank you message to participants after completing the research.</p>
          </div>
          <Switch />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-neutral-900">
              Title
            </label>
            <input
              type="text"
              id="title"
              placeholder="Enter a title for your thank you screen..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-neutral-900">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Write a thank you message for your participants..."
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="redirect-url" className="block text-sm font-medium text-neutral-900">
              Redirect URL (Optional)
            </label>
            <input
              type="url"
              id="redirect-url"
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-xs text-neutral-500">
              Participants will be redirected to this URL after completing the research.
            </p>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between pt-6 border-t border-neutral-100">
        <p className="text-sm text-neutral-500">Changes are saved automatically</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
          >
            Preview
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Save and Continue
          </button>
        </div>
      </footer>
    </div>
  );
} 