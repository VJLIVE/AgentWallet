import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import healthRoutes from './routes/health.js';
import ruleRoutes from './routes/rules.js';
import paymentRoutes from './routes/payments.js';
import agentRoutes from './routes/agent.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register CORS
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

// Register routes
fastify.register(healthRoutes, { prefix: '/api' });
fastify.register(ruleRoutes, { prefix: '/api' });
fastify.register(paymentRoutes, { prefix: '/api' });
fastify.register(agentRoutes, { prefix: '/api' });

// Root route
fastify.get('/', async (request, reply) => {
  return {
    name: 'AgentWallet - Autonomous Payment Guardian',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      parseRule: 'POST /api/parse-rule',
      saveRule: 'POST /api/rules',
      getRules: 'GET /api/rules/:walletAddress',
      validatePayment: 'POST /api/validate-payment',
      executePayment: 'POST /api/execute-payment',
      // AI Agent endpoints
      executeTask: 'POST /api/agent/execute-task',
      attemptPayment: 'POST /api/agent/attempt-payment',
      getAgentLogs: 'GET /api/agent/logs/:walletAddress',
      getServices: 'GET /api/agent/services',
    },
  };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`
    🚀 AgentWallet Backend Server Started!
    
    📍 Server: http://localhost:${port}
    🌐 Environment: ${process.env.NODE_ENV || 'development'}
    🔗 Algorand Network: ${process.env.ALGOD_SERVER}
    📱 Smart Contract App ID: ${process.env.ALGOSUB_APP_ID}
    🤖 Ollama: ${process.env.OLLAMA_BASE_URL}
    
    Ready to accept requests! 🎉
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
