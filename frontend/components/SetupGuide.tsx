'use client';

import { AlertCircle, Database, CheckCircle2 } from 'lucide-react';

export default function SetupGuide() {
  return (
    <div className="enterprise-card p-6 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Database Setup Required
          </h3>
          <p className="text-sm text-neutral-700 mb-4">
            It looks like your Supabase database tables haven't been created yet. Follow these steps to set up:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Open Supabase SQL Editor</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Go to your Supabase project → SQL Editor
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Run the setup SQL</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Copy and run the SQL from <code className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-xs">backend/schema/supabase-setup.sql</code>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Refresh this page</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Once the tables are created, refresh to start using AgentWallet
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white border border-neutral-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-neutral-600" />
              <span className="text-xs font-semibold text-neutral-900">Required Tables:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <code className="text-xs px-2 py-1 bg-neutral-100 border border-neutral-200 rounded">rules</code>
              <code className="text-xs px-2 py-1 bg-neutral-100 border border-neutral-200 rounded">agent_logs</code>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-800">
              <strong>Tip:</strong> The SQL script includes table creation, indexes, and Row Level Security policies. It's safe to run multiple times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
