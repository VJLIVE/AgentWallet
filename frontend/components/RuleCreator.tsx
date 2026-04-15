'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { parseRule, saveRule } from '@/lib/api';
import toast from 'react-hot-toast';
import { Sparkles, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface RuleCreatorProps {
  onRuleCreated: () => void;
}

export default function RuleCreator({ onRuleCreated }: RuleCreatorProps) {
  const { accountAddress, isConnected } = useWallet();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedRule, setParsedRule] = useState<{ vendor: string; maxAmount: number } | null>(null);

  const handleParse = async () => {
    if (!input.trim()) {
      toast.error('Please enter a rule');
      return;
    }

    setLoading(true);
    try {
      const rule = await parseRule(input);
      setParsedRule(rule);
      toast.success('Rule parsed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse rule');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accountAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!parsedRule) {
      toast.error('Please parse a rule first');
      return;
    }

    setLoading(true);
    try {
      await saveRule({
        walletAddress: accountAddress,
        vendor: parsedRule.vendor,
        maxAmount: parsedRule.maxAmount,
      });
      toast.success('Rule saved successfully!');
      setInput('');
      setParsedRule(null);
      onRuleCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save rule');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="enterprise-card p-6 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Wallet Connection Required</h3>
            <p className="text-sm text-amber-800">Connect your wallet to create spending rules</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">Create Spending Rule</h2>
        <p className="text-sm text-neutral-600">Use natural language to define your spending limits</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Rule Description
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Allow Swiggy payments under 300 ALGO"
            className="enterprise-input w-full resize-none"
            rows={3}
            disabled={loading}
          />
          <p className="mt-2 text-xs text-neutral-500">
            Describe your spending rule in plain English. Our AI will parse and structure it.
          </p>
        </div>

        <button
          onClick={handleParse}
          disabled={loading || !input.trim()}
          className="enterprise-button-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Parsing with AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Parse Rule with AI</span>
            </>
          )}
        </button>

        {parsedRule && (
          <div className="enterprise-card bg-green-50 border-green-200 p-5 space-y-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-3">Rule Parsed Successfully</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 border-b border-green-200">
                    <span className="text-sm font-medium text-neutral-700">Vendor</span>
                    <span className="text-sm font-semibold text-neutral-900">{parsedRule.vendor}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-green-200">
                    <span className="text-sm font-medium text-neutral-700">Maximum Amount</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-neutral-900">
                        {(parsedRule.maxAmount / 1_000_000).toFixed(2)} ALGO
                      </div>
                      <div className="text-xs text-neutral-500">
                        {parsedRule.maxAmount.toLocaleString()} microALGO
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Rule</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="enterprise-card bg-blue-50 border-blue-100 p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2.5">Example Rules</h4>
        <ul className="space-y-1.5 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>"Allow Swiggy payments under 300 ALGO"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>"Set Zomato limit to 500 ALGO"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>"Amazon payments max 100 ALGO"</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
