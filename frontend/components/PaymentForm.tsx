'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { validatePayment } from '@/lib/api';
import { algodClient, algoToMicroAlgos, microAlgosToAlgo } from '@/lib/algorand';
import algosdk from 'algosdk';
import toast from 'react-hot-toast';
import { Send, AlertCircle, CheckCircle2, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';

export default function PaymentForm() {
  const { accountAddress, isConnected, signTransaction } = useWallet();
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState('');

  const handlePayment = async () => {
    if (!accountAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    // Capture as non-null local variables
    const senderAddress: string = accountAddress;

    // Trim and validate all inputs
    const trimmedReceiver = receiver.trim();
    const trimmedVendor = vendor.trim();
    const trimmedAmount = amount.trim();

    if (!trimmedReceiver || !trimmedAmount || !trimmedVendor) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate receiver address format
    if (trimmedReceiver.length !== 58) {
      toast.error(`Invalid Algorand address. Must be exactly 58 characters (currently ${trimmedReceiver.length}).`);
      return;
    }

    // Validate address using algosdk
    if (!algosdk.isValidAddress(trimmedReceiver)) {
      toast.error('Invalid Algorand address format.');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(trimmedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount. Must be greater than 0.');
      return;
    }

    const amountInMicroAlgos = algoToMicroAlgos(amountNum);

    setLoading(true);
    setTxId('');

    try {
      // Step 1: Validate against rules
      toast.loading('Validating payment against rules...', { id: 'validation' });
      const validation = await validatePayment(senderAddress, trimmedVendor, amountInMicroAlgos);
      toast.dismiss('validation');

      if (!validation.allowed) {
        // Format error message in a user-friendly way
        let errorMessage = validation.reason;
        
        if (validation.rule && validation.payment) {
          const maxAllowed = validation.rule.maxAmountInAlgo;
          const attempted = validation.payment.amountInAlgo;
          const excess = validation.differenceInAlgo;
          
          errorMessage = `Payment blocked: You're trying to send ${attempted} ALGO to ${trimmedVendor}, but your limit is ${maxAllowed} ALGO. You're over by ${excess} ALGO.`;
        }
        
        toast.error(errorMessage, { duration: 6000 });
        setLoading(false);
        return;
      }

      toast.success('Payment validated! ✅');

      // Step 2: Create transaction
      toast.loading('Creating transaction...', { id: 'create' });
      const suggestedParams = await algodClient.getTransactionParams().do();

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAddress,
        receiver: trimmedReceiver,
        amount: BigInt(amountInMicroAlgos),
        suggestedParams,
        note: new Uint8Array(Buffer.from(`AlgoSub payment to ${trimmedVendor}`)),
      });

      toast.dismiss('create');

      // Step 3: Sign transaction
      toast.loading('Please sign the transaction in your wallet...', { id: 'sign' });
      const signedTxn = await signTransaction(txn);
      toast.dismiss('sign');

      // Step 4: Send transaction
      toast.loading('Sending transaction...', { id: 'send' });
      const sendResult = await algodClient.sendRawTransaction(signedTxn).do();
      const transactionId = sendResult.txid;
      toast.dismiss('send');

      // Step 5: Wait for confirmation
      toast.loading('Waiting for confirmation...', { id: 'confirm' });
      await algosdk.waitForConfirmation(algodClient, transactionId, 4);
      toast.dismiss('confirm');

      setTxId(transactionId);
      toast.success('Payment successful! 🎉');

      // Reset form
      setReceiver('');
      setAmount('');
      setVendor('');
    } catch (error: any) {
      // Dismiss any lingering toasts
      toast.dismiss('validation');
      toast.dismiss('create');
      toast.dismiss('sign');
      toast.dismiss('send');
      toast.dismiss('confirm');
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
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
            <p className="text-sm text-amber-800">Connect your wallet to make payments</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">Execute Payment</h2>
        <p className="text-sm text-neutral-600">Send payments with automatic rule validation</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Vendor Name
          </label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g., Swiggy, Zomato, Amazon"
            className="enterprise-input w-full"
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Must match an existing spending rule
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Receiver Address
          </label>
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            placeholder="Algorand address (58 characters)"
            className={`enterprise-input w-full font-mono text-sm ${
              receiver && receiver.trim().length > 0 && receiver.trim().length !== 58 
                ? 'border-amber-300 focus:border-amber-500' 
                : ''
            }`}
            disabled={loading}
            maxLength={58}
          />
          <p className={`mt-1.5 text-xs ${
            receiver && receiver.trim().length > 0 && receiver.trim().length !== 58 
              ? 'text-amber-600' 
              : 'text-neutral-500'
          }`}>
            {receiver.trim() 
              ? `${receiver.trim().length}/58 characters` 
              : 'Valid Algorand TestNet address (58 characters)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Amount (ALGO)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="enterprise-input w-full"
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Amount will be validated against your spending rules
          </p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !receiver || !amount || !vendor}
          className="enterprise-button-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Payment</span>
            </>
          )}
        </button>

        {txId && (
          <div className="enterprise-card bg-green-50 border-green-200 p-5 space-y-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Payment Successful!</h3>
                <p className="text-sm text-green-800 mb-3">Your transaction has been confirmed on the blockchain</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-neutral-600 block mb-1">Transaction ID</span>
                    <code className="block text-xs font-mono bg-white p-2.5 rounded border border-green-200 break-all text-neutral-900">
                      {txId}
                    </code>
                  </div>
                  <a
                    href={`https://testnet.algoexplorer.io/tx/${txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <span>View on AlgoExplorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="enterprise-card bg-blue-50 border-blue-100 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Payment Validation Process</h4>
            <ol className="space-y-1.5 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">1.</span>
                <span>Payment validated against your spending rules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">2.</span>
                <span>Transaction created and signed via Pera Wallet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">3.</span>
                <span>Submitted to Algorand TestNet for processing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">4.</span>
                <span>Confirmation received with transaction ID</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
