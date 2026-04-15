'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getRules, Rule } from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import SetupGuide from './SetupGuide';

interface RulesListProps {
  refreshTrigger: number;
}

export default function RulesList({ refreshTrigger }: RulesListProps) {
  const { accountAddress, isConnected } = useWallet();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    if (isConnected && accountAddress) {
      fetchRules();
    }
  }, [isConnected, accountAddress, refreshTrigger]);

  const fetchRules = async () => {
    if (!accountAddress) return;

    setLoading(true);
    setShowSetupGuide(false);
    try {
      const fetchedRules = await getRules(accountAddress);
      setRules(fetchedRules);
      
      // If we get an empty array and it's the first load, might be setup issue
      if (fetchedRules.length === 0 && refreshTrigger === 0) {
        // Check if it's actually a database issue by looking at the response
        // For now, we'll just show the empty state
      }
    } catch (error: any) {
      console.error('Error fetching rules:', error);
      // Show setup guide if there's a database error
      if (error.message?.includes('relation') || error.message?.includes('table')) {
        setShowSetupGuide(true);
      } else {
        toast.error('Unable to load rules. Please check your database setup.');
      }
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  if (loading) {
    return (
      <div className="enterprise-card p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Your Spending Rules</h2>
        <div className="flex items-center gap-3 text-neutral-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading rules...</span>
        </div>
      </div>
    );
  }

  if (showSetupGuide) {
    return <SetupGuide />;
  }

  return (
    <div className="enterprise-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-1">Your Spending Rules</h2>
          <p className="text-sm text-neutral-600">
            {rules.length} {rules.length === 1 ? 'rule' : 'rules'} configured
          </p>
        </div>
        {rules.length > 0 && (
          <span className="badge badge-success">
            {rules.length} Active
          </span>
        )}
      </div>
      
      {rules.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Rules Yet</h3>
          <p className="text-neutral-600 max-w-sm mx-auto">
            Create your first spending rule above to start controlling your payments with AI
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="enterprise-card p-4 hover:border-neutral-300"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-neutral-900 mb-1">{rule.vendor}</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-sm text-neutral-600">Maximum Amount:</span>
                      <span className="text-base font-semibold text-neutral-900">
                        {(rule.maxAmount / 1_000_000).toFixed(2)} ALGO
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {rule.maxAmount.toLocaleString()} microALGO
                    </div>
                    {rule.createdAt && (
                      <p className="text-xs text-neutral-400 mt-2">
                        Created {new Date(rule.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <span className="badge badge-success flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
