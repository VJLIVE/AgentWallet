/**
 * Rule management routes
 * Stage 2: AI Rule Creation
 * Stage 3: Store Rules
 */
import { parseRuleWithAI } from '../services/ollama.js';
import { saveRule, getRulesByWallet } from '../services/supabase.js';

export default async function ruleRoutes(fastify, options) {
  /**
   * POST /api/parse-rule
   * Stage 2: Convert natural language to structured rule
   */
  fastify.post('/parse-rule', async (request, reply) => {
    const { input } = request.body;

    if (!input || typeof input !== 'string') {
      return reply.code(400).send({
        error: 'Invalid input',
        message: 'Please provide a valid rule description',
      });
    }

    try {
      fastify.log.info(`Parsing rule: "${input}"`);

      const rule = await parseRuleWithAI(input);

      return {
        success: true,
        input,
        rule,
        message: 'Rule parsed successfully',
      };
    } catch (error) {
      fastify.log.error('Error parsing rule:', error);
      return reply.code(500).send({
        error: 'Failed to parse rule',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/rules
   * Stage 3: Save rule to database
   */
  fastify.post('/rules', async (request, reply) => {
    const { walletAddress, vendor, maxAmount } = request.body;

    if (!walletAddress || !vendor || maxAmount === undefined) {
      return reply.code(400).send({
        error: 'Invalid request',
        message: 'walletAddress, vendor, and maxAmount are required',
      });
    }

    try {
      fastify.log.info(`Saving rule for wallet: ${walletAddress}`);

      const savedRule = await saveRule({
        walletAddress,
        vendor,
        maxAmount,
      });

      return {
        success: true,
        rule: savedRule,
        message: 'Rule saved successfully',
      };
    } catch (error) {
      fastify.log.error('Error saving rule:', error);
      return reply.code(500).send({
        error: 'Failed to save rule',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/rules/:walletAddress
   * Stage 3: Get all rules for a wallet
   */
  fastify.get('/rules/:walletAddress', async (request, reply) => {
    const { walletAddress } = request.params;

    if (!walletAddress) {
      return reply.code(400).send({
        error: 'Invalid request',
        message: 'walletAddress is required',
      });
    }

    try {
      fastify.log.info(`Fetching rules for wallet: ${walletAddress}`);

      const rules = await getRulesByWallet(walletAddress);

      return {
        success: true,
        walletAddress,
        rules: rules || [],
        count: rules ? rules.length : 0,
      };
    } catch (error) {
      fastify.log.error('Error fetching rules:', error);
      // Return empty array instead of error for better UX
      return {
        success: true,
        walletAddress,
        rules: [],
        count: 0,
      };
    }
  });
}
