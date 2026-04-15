'use client';

import PaymentForm from '@/components/PaymentForm';
import { useWallet } from '@/contexts/WalletContext';
import { Send, Lock, ShieldCheck, TestTube, Lightbulb, Info } from 'lucide-react';

export default function PaymentsPage() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-indigo-600" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Execute Payment</h1>
          </div>
          <p className="text-neutral-600">
            Send ALGO payments with automatic rule validation and blockchain security
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
              Connect your Pera Wallet to execute payments with automatic rule validation
            </p>
            <p className="text-sm text-neutral-500">
              Click "Connect Wallet" in the navigation bar above to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Form - Takes 2 columns */}
            <div className="lg:col-span-2">
              <PaymentForm />
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              {/* How it Works */}
              <div className="enterprise-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-neutral-900">
                    How It Works
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    'Enter payment details and vendor name',
                    'System validates against your rules',
                    'If allowed, sign transaction in wallet',
                    'Payment sent to Algorand network',
                    'Receive confirmation with transaction ID'
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-blue-700">{index + 1}</span>
                      </div>
                      <p className="text-sm text-neutral-700 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="enterprise-card bg-green-50 border-green-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <h3 className="text-base font-semibold text-green-900">
                    Protected by Rules
                  </h3>
                </div>
                <p className="text-sm text-green-800 leading-relaxed">
                  All payments are automatically validated against your spending rules. 
                  Payments exceeding your limits will be blocked before reaching your wallet.
                </p>
              </div>

              {/* TestNet Notice */}
              <div className="enterprise-card bg-blue-50 border-blue-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TestTube className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-blue-900">
                    TestNet Mode
                  </h3>
                </div>
                <p className="text-sm text-blue-800 mb-3 leading-relaxed">
                  You're using Algorand TestNet. Transactions use test ALGO with no real value.
                </p>
                <a
                  href="https://bank.testnet.algorand.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Get TestNet ALGO</span>
                  <span>→</span>
                </a>
              </div>

              {/* Quick Tips */}
              <div className="enterprise-card bg-purple-50 border-purple-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-semibold text-purple-900">
                    Quick Tips
                  </h3>
                </div>
                <ul className="space-y-2">
                  {[
                    'Vendor name must match your rule exactly',
                    'Amount is in ALGO (not microAlgos)',
                    'Transactions take ~4 seconds to confirm',
                    'View transactions on AlgoExplorer'
                  ].map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-purple-800">
                      <span className="text-purple-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
