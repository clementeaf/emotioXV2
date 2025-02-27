'use client';

import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface WelcomeScreenFormProps {
  className?: string;
}

export function WelcomeScreenForm({ className }: WelcomeScreenFormProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <header>
        <h1 className="text-lg font-semibold text-neutral-900">
          1.0 - Welcome screen
        </h1>
        <p className="text-sm text-neutral-500">
          Configure the initial screen that participants will see when starting the research.
        </p>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-medium text-neutral-900">Enable Welcome Screen</h2>
            <p className="text-sm text-neutral-500">Show a welcome message to participants before starting the research.</p>
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
              placeholder="Enter a title for your welcome screen..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-neutral-900">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Write a welcome message for your participants..."
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="start-button" className="block text-sm font-medium text-neutral-900">
              Start Button Text
            </label>
            <input
              type="text"
              id="start-button"
              defaultValue="Start"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
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