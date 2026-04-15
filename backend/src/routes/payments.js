/**
 * Payment routes
 * Stage 1: Wallet + Payment
 * Stage 4: Rule Validation Engine
 * Stage 6: Integrate Contract with Payment
 */
import { validatePaymentAgainstRules } from '../services/validation.js';
import { executePaymentWithContract } from '../services/algorand.js';

export default async function paymentRoutes(fastify, options) {
  /**
   * POST /api/validate-payment
   * Stage 4: Validate payment against stored rules
   */
  fastify.post('/validate-payment', async (request, reply) => {
    const { walletAddress, vendor, amount } = request.body;

    if (!walletAddress || !vendor || amount === undefined) {
      return reply.code(400).send({
        error: 'Invalid request',
        message: 'walletAddress, vendor, and amount are required',
      });
    }

    try {
      fastify.log.info(
        `Validating payment: ${amount} microALGO to ${vendor} from ${walletAddress}`
      );

      const validation = await validatePaymentAgainstRules({
        walletAddress,
        vendor,
        amount,
      });

      return {
        success: true,
        validation,
      };
    } catch (error) {
      fastify.log.error('Error validating payment:', error);
      return reply.code(500).send({
        error: 'Failed to validate payment',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/execute-payment
   * Stage 1 & 6: Execute payment transaction
   * Integrates with smart contract for validation
   */
  fastify.post('/execute-payment', async (request, reply) => {
    const { walletAddress, receiver, amount, vendor } = request.body;

    if (!walletAddress || !receiver || amount === undefined) {
      return reply.code(400).send({
        error: 'Invalid request',
        message: 'walletAddress, receiver, and amount are required',
      });
    }

    try {
      fastify.log.info(
        `Executing payment: ${amount} microALGO from ${walletAddress} to ${receiver}`
      );

      // First validate against rules
      if (vendor) {
        const validation = await validatePaymentAgainstRules({
          walletAddress,
          vendor,
          amount,
        });

        if (!validation.allowed) {
          return reply.code(403).send({
            success: false,
            error: 'Payment not allowed',
            message: validation.reason,
            validation,
          });
        }
      }

      // Execute payment (will be implemented with wallet integration)
      const result = await executePaymentWithContract({
        walletAddress,
        receiver,
        amount,
      });

      return {
        success: true,
        transaction: result,
        message: 'Payment executed successfully',
      };
    } catch (error) {
      fastify.log.error('Error executing payment:', error);
      return reply.code(500).send({
        error: 'Failed to execute payment',
        message: error.message,
      });
    }
  });
}
