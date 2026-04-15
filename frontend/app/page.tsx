'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useEffect, useState } from 'react';
import { getRules } from '@/lib/api';
import { getAccountBalance, microAlgosToAlgo } from '@/lib/algorand';
import { 
  Wallet, 
  Shield, 
  TrendingUp, 
  Activity,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { accountAddress, isConnected } = useWallet();
  const [stats, setStats] = useState({
    balance: 0,
    rulesCount: 0,
    activeRules: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && accountAddress) {
      loadStats();
    }
  }, [isConnected, accountAddress]);

  const loadStats = async () => {
    if (!accountAddress) return;
    
    setLoading(true);
    try {
      const [balance, rules] = await Promise.all([
        getAccountBalance(accountAddress),
        getRules(accountAddress),
      ]);

      setStats({
        balance: microAlgosToAlgo(balance),
        rulesCount: rules.length,
        activeRules: rules.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-white via-blue-50/30 to-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Enterprise Payment Control Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6 tracking-tight">
            Intelligent Spending
            <br />
            <span className="gradient-text">Control for Algorand</span>
          </h1>
          
          <p className="text-xl text-neutral-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Set spending rules in natural language. AI-powered validation with blockchain security. 
            Enterprise-grade control for your digital payments.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="enterprise-card p-8 text-left">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Blockchain Security</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                On-chain validation with Algorand smart contracts ensures tamper-proof rule enforcement
              </p>
            </div>
            
            <div className="enterprise-card p-8 text-left">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">AI-Powered Rules</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Create complex spending rules using natural language - no technical knowledge required
              </p>
            </div>
            
            <div className="enterprise-card p-8 text-left">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Real-Time Validation</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Instant payment validation against your rules with sub-second response times
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-neutral-700">
              Connect your Pera Wallet to get started
            </p>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure Connection</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TestNet Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 tracking-tight">Dashboard</h1>
          <p className="text-neutral-600">Monitor your account and manage payment rules</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              <span className="badge badge-primary">Active</span>
            </div>
            <div className="text-sm font-medium text-neutral-600 mb-1">Account Balance</div>
            <div className="text-3xl font-bold text-neutral-900 mb-1 tracking-tight">
              {loading ? '...' : stats.balance.toFixed(2)}
            </div>
            <div className="text-sm text-neutral-500">ALGO</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" strokeWidth={2} />
              </div>
              <span className="badge badge-success">Enforced</span>
            </div>
            <div className="text-sm font-medium text-neutral-600 mb-1">Active Rules</div>
            <div className="text-3xl font-bold text-neutral-900 mb-1 tracking-tight">
              {loading ? '...' : stats.activeRules}
            </div>
            <div className="text-sm text-neutral-500">Rules configured</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" strokeWidth={2} />
              </div>
              <span className="badge badge-success">Operational</span>
            </div>
            <div className="text-sm font-medium text-neutral-600 mb-1">System Status</div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-neutral-900">Active</span>
            </div>
            <div className="text-sm text-neutral-500">All systems operational</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/rules"
              className="enterprise-card p-6 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Shield className="w-5 h-5 text-blue-600" strokeWidth={2} />
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Manage Spending Rules
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Create and configure spending rules with AI assistance. Set limits for vendors and payment categories.
              </p>
            </Link>

            <Link
              href="/payments"
              className="enterprise-card p-6 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <TrendingUp className="w-5 h-5 text-indigo-600" strokeWidth={2} />
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Execute Payment
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Send payments with automatic rule validation. Transactions are verified against your configured rules.
              </p>
            </Link>
          </div>
        </div>

        {/* Smart Contract Info */}
        <div className="enterprise-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Smart Contract Powered
              </h3>
              <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
                Your spending rules are enforced by Algorand smart contracts, ensuring secure, transparent, 
                and tamper-proof payment validation on the blockchain.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-600 font-medium">Contract ID:</span>
                  <code className="px-2 py-1 bg-white border border-neutral-200 rounded font-mono text-neutral-900">
                    758847371
                  </code>
                </div>
                <a
                  href="https://lora.algokit.io/testnet/application/758847371"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <span>View on Explorer</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
