'use client';

import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CreateResearchForm } from '@/components/research/CreateResearchForm';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function CreateResearchContent() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar className="w-60 shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen bg-neutral-50">
        <Navbar className="shrink-0" />
        
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <div className="container max-w-7xl mx-auto px-8 py-10">
              {/* Header */}
              <div className="mb-10">
                <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-3" aria-label="Breadcrumb">
                  <Link 
                    href="/dashboard" 
                    className="hover:text-neutral-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <span className="text-neutral-300">/</span>
                  <Link 
                    href="/dashboard/research" 
                    className="hover:text-neutral-900 transition-colors"
                  >
                    Research
                  </Link>
                  <span className="text-neutral-300">/</span>
                  <span className="text-neutral-900">New Research</span>
                </nav>
                <h1 className="text-2xl font-semibold text-neutral-900">
                  Create a new research
                </h1>
                <p className="mt-2 text-neutral-500 text-sm">
                  Follow the steps below to create a new research project. You can save your progress at any time.
                </p>
              </div>

              {/* Form */}
              <CreateResearchForm />

              {/* Optional: Tips or Help Section */}
              <div className="mt-8 text-center">
                <p className="text-sm text-neutral-400">
                  Need help? Check our <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">documentation</a> or <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">contact support</a>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CreateResearchPage() {
  return (
    <ErrorBoundary>
      <CreateResearchContent />
    </ErrorBoundary>
  );
} 