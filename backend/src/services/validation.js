/**
 * Payment Validation Service
 * Stage 4: Rule Validation Engine
 */
import { getRuleByVendor } from './supabase.js';

/**
 * Validate a payment against stored rules
 * @param {Object} payment - Payment details
 * @param {string} payment.walletAddress - User's wallet address
 * @param {string} payment.vendor - Vendor name
 * @param {number} payment.amount - Payment amount in microAlgos
 * @returns {Promise<Object>} Validation result
 */
export async function validatePaymentAgainstRules({
  walletAddress,
  vendor,
  amount,
}) {
  try {
    // Get the rule for this vendor
    const rule = await getRuleByVendor(walletAddress, vendor);

    // If no rule exists, deny by default (or you can allow - depends on your logic)
    if (!rule) {
      return {
        allowed: false,
        reason: `No spending rule found for vendor: ${vendor}`,
        rule: null,
        payment: {
          vendor,
          amount,
          amountInAlgo: amount / 1_000_000,
        },
      };
    }

    // Check if amount exceeds max amount
    const allowed = amount <= rule.maxAmount;

    return {
      allowed,
      reason: allowed
        ? 'Payment is within allowed limit'
        : `Payment amount (${amount} microALGO) exceeds maximum allowed (${rule.maxAmount} microALGO)`,
      rule: {
        vendor: rule.vendor,
        maxAmount: rule.maxAmount,
        maxAmountInAlgo: rule.maxAmount / 1_000_000,
      },
      payment: {
        vendor,
        amount,
        amountInAlgo: amount / 1_000_000,
      },
      difference: rule.maxAmount - amount,
      differenceInAlgo: (rule.maxAmount - amount) / 1_000_000,
    };
  } catch (error) {
    console.error('Validation error:', error);
    throw new Error(`Failed to validate payment: ${error.message}`);
  }
}

/**
 * Enhanced validation for AI agents with structured decision response
 * @param {Object} payment - Payment attempt details
 * @returns {Promise<Object>} Structured decision
 */
export async function validateAgentPaymentAttempt({
  agentId,
  walletAddress,
  vendor,
  amount,
  metadata = {},
}) {
  try {
    // Get the rule for this vendor
    const rule = await getRuleByVendor(walletAddress, vendor);

    // If no rule exists, block with guidance
    if (!rule) {
      return {
        status: 'blocked',
        reason: `No spending rule configured for vendor: ${vendor}`,
        allowedAmount: 0,
        requestedAmount: amount,
        requestedAmountInAlgo: amount / 1_000_000,
        guidance: `Create a spending rule for ${vendor} before attempting payments`,
        rule: null,
        metadata,
      };
    }

    // Check if amount is within limit
    if (amount <= rule.maxAmount) {
      return {
        status: 'approved',
        reason: 'Payment is within configured spending limit',
        allowedAmount: amount,
        requestedAmount: amount,
        requestedAmountInAlgo: amount / 1_000_000,
        rule: {
          vendor: rule.vendor,
          maxAmount: rule.maxAmount,
          maxAmountInAlgo: rule.maxAmount / 1_000_000,
        },
        metadata,
      };
    }

    // Amount exceeds limit - suggest modification
    return {
      status: 'modified',
      reason: `Requested amount exceeds limit. Maximum allowed: ${rule.maxAmount / 1_000_000} ALGO`,
      allowedAmount: rule.maxAmount,
      allowedAmountInAlgo: rule.maxAmount / 1_000_000,
      requestedAmount: amount,
      requestedAmountInAlgo: amount / 1_000_000,
      difference: amount - rule.maxAmount,
      differenceInAlgo: (amount - rule.maxAmount) / 1_000_000,
      guidance: `Reduce payment amount or choose a cheaper service alternative`,
      rule: {
        vendor: rule.vendor,
        maxAmount: rule.maxAmount,
        maxAmountInAlgo: rule.maxAmount / 1_000_000,
      },
      metadata,
    };
  } catch (error) {
    console.error('Agent validation error:', error);
    return {
      status: 'error',
      reason: `Validation failed: ${error.message}`,
      allowedAmount: 0,
      requestedAmount: amount,
      metadata,
    };
  }
}

/**
 * Validate multiple payments in batch
 * @param {Array} payments - Array of payment objects
 * @returns {Promise<Array>} Array of validation results
 */
export async function validateMultiplePayments(payments) {
  const validations = await Promise.all(
    payments.map((payment) => validatePaymentAgainstRules(payment))
  );

  return validations;
}
