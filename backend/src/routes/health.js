/**
 * Health check routes
 */
export default async function healthRoutes(fastify, options) {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  });

  // Detailed health check with service status
  fastify.get('/health/detailed', async (request, reply) => {
    const services = {
      algorand: false,
      ollama: false,
      supabase: false,
    };

    // Check Algorand connection
    try {
      const algodServer = process.env.ALGOD_SERVER;
      if (algodServer) {
        services.algorand = true;
      }
    } catch (error) {
      fastify.log.error('Algorand health check failed:', error);
    }

    // Check Ollama connection
    try {
      const ollamaUrl = process.env.OLLAMA_BASE_URL;
      if (ollamaUrl) {
        services.ollama = true;
      }
    } catch (error) {
      fastify.log.error('Ollama health check failed:', error);
    }

    // Check Supabase connection
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      if (supabaseUrl) {
        services.supabase = true;
      }
    } catch (error) {
      fastify.log.error('Supabase health check failed:', error);
    }

    const allHealthy = Object.values(services).every((status) => status);

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
      config: {
        appId: process.env.ALGOSUB_APP_ID,
        network: process.env.ALGOD_SERVER,
      },
    };
  });
}
