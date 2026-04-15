'use client';

import { useState } from 'react';
import RuleCreator from '@/components/RuleCreator';
import RulesList from '@/components/RulesList';
import { useWallet } from '@/contexts/WalletContext';
import { Shield, Lock } from 'lucide-react';

export default function RulesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isConnected } = useWallet();

  const handleRuleCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Spending Rules</h1>
          </div>
          <p className="text-neutral-600">
            Create and manage AI-powered spending rules for your Algorand payments
          </p>
        </div>

        {!isConnected ? (
          <div className="enterprise-card p-12 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-neutral-400" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
              Wallet Connection Required
            </h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Connect your Pera Wallet to create and manage spending rules for your payments
            </p>
            <p className="text-sm text-neutral-500">
              Click "Connect Wallet" in the navigation bar above to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <RuleCreator onRuleCreated={handleRuleCreated} />
            </div>
            <div>
              <RulesList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
