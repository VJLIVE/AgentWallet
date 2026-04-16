/**
 * AI Agent Routes
 * Endpoints for autonomous agent payment attempts and task execution
 */
import { executeAgentTask, getServiceCatalog, getServiceById } from '../services/agent.js';
import { validateAgentPaymentAttempt } from '../services/validation.js';
import { saveAgentLog, getAgentLogs } from '../services/supabase.js';

export default async function agentRoutes(fastify, options) {
  /**
   * POST /api/agent/execute-task
   * Execute a task with autonomous agent
   */
  fastify.post('/agent/execute-task', async (request, reply) => {
    try {
      const { taskDescription, budget, walletAddress } = request.body;

      if (!taskDescription || !budget || !walletAddress) {
        return reply.code(400).send({
          error: 'Missing required fields: taskDescription, budget, walletAddress',
        });
      }

      fastify.log.info(`Agent task execution: ${taskDescription}`);

      const result = await executeAgentTask({
        taskDescription,
        budget,
        walletAddress,
      });

      // Save agent logs to database
      for (const log of result.logs) {
        try {
          await saveAgentLog({
            agentId: result.agentId,
            walletAddress,
            logType: log.type,
            message: log.message,
            data: log.data,
            timestamp: log.timestamp,
          });
        } catch (logError) {
          fastify.log.error('Error saving agent log:', logError);
          // Continue even if log saving fails
        }
      }

      return reply.send({
        success: true,
        result,
      });
    } catch (error) {
      fastify.log.error('Agent task execution error:', error);
      return reply.code(500).send({
        error: 'Failed to execute agent task',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/agent/submit-payment
   * Submit signed payment transaction
   */
  fastify.post('/agent/submit-payment', async (request, reply) => {
    try {
      const { agentId, walletAddress, signedTxn } = request.body;

      if (!agentId || !walletAddress || !signedTxn) {
        return reply.code(400).send({
          error: 'Missing required fields: agentId, walletAddress, signedTxn',
        });
      }

      fastify.log.info(`Submitting signed payment for agent: ${agentId}`);

      // Import algorand service
      const { submitSignedTransaction } = await import('../services/algorand.js');

      // Convert base64 to Uint8Array
      const signedTxnBytes = new Uint8Array(Buffer.from(signedTxn, 'base64'));

      // Submit transaction
      const result = await submitSignedTransaction(signedTxnBytes);

      // Log payment execution
      await saveAgentLog({
        agentId,
        walletAddress,
        logType: 'payment_executed',
        message: `Payment executed successfully`,
        data: {
          txId: result.txId,
          confirmedRound: result.confirmedRound,
        },
        timestamp: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        result,
      });
    } catch (error) {
      fastify.log.error('Submit payment error:', error);
      return reply.code(500).send({
        error: 'Failed to submit payment',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/agent/attempt-payment
   * AI agent attempts a payment - returns structured decision
   */
  fastify.post('/agent/attempt-payment', async (request, reply) => {
    try {
      const { agentId, walletAddress, service, amount, metadata } = request.body;

      if (!agentId || !walletAddress || !service || amount === undefined) {
        return reply.code(400).send({
          error: 'Missing required fields: agentId, walletAddress, service, amount',
        });
      }

      fastify.log.info(`Agent payment attempt: ${service} - ${amount} microALGO`);

      // Validate payment attempt
      const decision = await validateAgentPaymentAttempt({
        agentId,
        walletAddress,
        vendor: service,
        amount,
        metadata: metadata || {},
      });

      // Log the attempt
      await saveAgentLog({
        agentId,
        walletAddress,
        logType: 'payment_attempt',
        message: `Payment attempt: ${service} - ${amount / 1_000_000} ALGO`,
        data: {
          service,
          amount,
          amountInAlgo: amount / 1_000_000,
          decision: decision.status,
        },
        timestamp: new Date().toISOString(),
      });

      // Log the decision
      await saveAgentLog({
        agentId,
        walletAddress,
        logType: `payment_${decision.status}`,
        message: decision.reason,
        data: decision,
        timestamp: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        decision,
      });
    } catch (error) {
      fastify.log.error('Agent payment attempt error:', error);
      return reply.code(500).send({
        error: 'Failed to process payment attempt',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/agent/logs/:walletAddress
   * Get agent execution logs for a wallet
   */
  fastify.get('/agent/logs/:walletAddress', async (request, reply) => {
    try {
      const { walletAddress } = request.params;
      const { agentId, limit = 100 } = request.query;

      const logs = await getAgentLogs(walletAddress, agentId, parseInt(limit));

      return reply.send({
        success: true,
        logs: logs || [],
        count: logs ? logs.length : 0,
      });
    } catch (error) {
      fastify.log.error('Get agent logs error:', error);
      // Return empty array instead of error
      return reply.send({
        success: true,
        logs: [],
        count: 0,
      });
    }
  });

  /**
   * GET /api/agent/services
   * Get available service catalog
   */
  fastify.get('/agent/services', async (request, reply) => {
    try {
      const services = getServiceCatalog();

      return reply.send({
        success: true,
        services,
        count: services.length,
      });
    } catch (error) {
      fastify.log.error('Get services error:', error);
      return reply.code(500).send({
        error: 'Failed to fetch services',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/agent/wallet-info
   * Get agent wallet information for x402 payments
   */
  fastify.get('/agent/wallet-info', async (request, reply) => {
    try {
      const { isX402Configured, getAgentWalletAddress, getAgentWalletBalance } = await import('../services/x402.js');
      
      if (!isX402Configured()) {
        return reply.send({
          success: true,
          configured: false,
          message: 'Agent wallet not configured. Set AGENT_WALLET_MNEMONIC in .env file.',
        });
      }

      const address = getAgentWalletAddress();
      const balance = await getAgentWalletBalance();

      return reply.send({
        success: true,
        configured: true,
        address,
        balance: balance.balanceInAlgo,
        balanceInMicroAlgo: balance.balance,
        minBalance: balance.minBalanceInAlgo,
      });
    } catch (error) {
      fastify.log.error('Get agent wallet info error:', error);
      return reply.code(500).send({
        error: 'Failed to get agent wallet info',
        message: error.message,
      });
    }
  });
  /**
   * GET /api/agent/services/:serviceId
   * Get service details by ID
   */
  fastify.get('/agent/services/:serviceId', async (request, reply) => {
    try {
      const { serviceId } = request.params;
      const service = getServiceById(serviceId);

      if (!service) {
        return reply.code(404).send({
          error: 'Service not found',
        });
      }

      return reply.send({
        success: true,
        service,
      });
    } catch (error) {
      fastify.log.error('Get service error:', error);
      return reply.code(500).send({
        error: 'Failed to fetch service',
        message: error.message,
      });
    }
  });
}