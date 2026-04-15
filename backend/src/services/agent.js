/**
 * AI Agent Service
 * Autonomous agent that can plan tasks and attempt payments
 */
import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

// Hardcoded service catalog for demo
const SERVICE_CATALOG = [
  {
    id: 'pdf-parser-cheap',
    name: 'Basic PDF Parser',
    vendor: 'PDFCo',
    cost: 500000, // 0.5 ALGO
    description: 'Basic PDF text extraction',
    walletAddress: 'BV7YPBZBZEFOHTWJCHP4ITG4IZDTQYSRPHC2GOBJBQXUXQRCLGYAUSZKMQ', // Cheapest service
  },
  {
    id: 'pdf-parser-premium',
    name: 'Premium PDF Parser',
    vendor: 'PDFPro',
    cost: 2000000, // 2 ALGO
    description: 'Advanced PDF parsing with OCR',
    walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Random
  },
  {
    id: 'llm-summarize-cheap',
    name: 'Basic Summarizer',
    vendor: 'TextAI',
    cost: 300000, // 0.3 ALGO
    description: 'Simple text summarization',
    walletAddress: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // Random
  },
  {
    id: 'llm-summarize-premium',
    name: 'Premium Summarizer',
    vendor: 'OpenAI',
    cost: 1500000, // 1.5 ALGO
    description: 'Advanced AI summarization',
    walletAddress: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', // Random
  },
];

/**
 * Agent decision-making loop with x402 automatic payment
 * @param {Object} task - Task details
 * @returns {Promise<Object>} Agent execution result
 */
export async function executeAgentTask({ taskDescription, budget, walletAddress }) {
  const agentId = `agent_${Date.now()}`;
  const logs = [];
  
  // Log initial task
  logs.push({
    timestamp: new Date().toISOString(),
    type: 'task_start',
    message: `Task received: ${taskDescription}`,
    data: { budget, budgetInAlgo: budget / 1_000_000 },
  });

  try {
    // Step 1: Parse task and select services
    const plan = await planTask(taskDescription, budget);
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'planning',
      message: `Agent planning: ${plan.reasoning}`,
      data: { selectedServices: plan.services },
    });

    // Step 2: Calculate total cost
    const totalCost = plan.services.reduce((sum, svc) => sum + svc.cost, 0);
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'cost_calculation',
      message: `Total estimated cost: ${totalCost / 1_000_000} ALGO`,
      data: { totalCost, totalCostInAlgo: totalCost / 1_000_000 },
    });

    // Step 3: Check budget and optimize if needed
    let finalPlan = plan;
    if (totalCost > budget) {
      logs.push({
        timestamp: new Date().toISOString(),
        type: 'budget_exceeded',
        message: `Initial plan exceeds budget. Attempting to optimize...`,
        data: { required: totalCost, available: budget },
      });

      // Retry with cheaper alternatives
      finalPlan = await optimizePlan(plan, budget);
      logs.push({
        timestamp: new Date().toISOString(),
        type: 'optimization',
        message: `Optimized plan created`,
        data: { selectedServices: finalPlan.services },
      });
    }

    // Step 4: Select the cheapest service within budget
    const affordableServices = finalPlan.services.filter(svc => svc.cost <= budget);
    if (affordableServices.length === 0) {
      throw new Error('No services available within budget');
    }

    // Sort by cost and pick the cheapest
    const cheapestService = affordableServices.sort((a, b) => a.cost - b.cost)[0];
    
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'service_selection',
      message: `Selected cheapest service: ${cheapestService.name} (${cheapestService.cost / 1_000_000} ALGO)`,
      data: { selectedService: cheapestService },
    });

    // Step 5: Execute x402 automatic payment
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'payment_initiating',
      message: `Initiating x402 automatic payment to ${cheapestService.vendor}`,
      data: {
        amount: cheapestService.cost,
        amountInAlgo: cheapestService.cost / 1_000_000,
        receiver: cheapestService.walletAddress,
        protocol: 'x402',
      },
    });

    const { executeX402Payment } = await import('./x402.js');
    const paymentResult = await executeX402Payment({
      receiverAddress: cheapestService.walletAddress,
      amount: cheapestService.cost,
      note: `x402: ${cheapestService.name} - ${taskDescription}`,
    });

    logs.push({
      timestamp: new Date().toISOString(),
      type: 'payment_executed',
      message: `x402 payment executed successfully to ${cheapestService.vendor}`,
      data: {
        txId: paymentResult.txId,
        amount: cheapestService.cost,
        amountInAlgo: cheapestService.cost / 1_000_000,
        receiver: cheapestService.walletAddress,
        confirmedRound: paymentResult.confirmedRound,
        protocol: 'x402',
      },
    });

    return {
      agentId,
      status: 'executed',
      plan: finalPlan,
      selectedService: cheapestService,
      paymentResult,
      logs,
      totalCost: cheapestService.cost,
    };
  } catch (error) {
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'error',
      message: `Agent error: ${error.message}`,
      data: { error: error.message },
    });

    return {
      agentId,
      status: 'failed',
      error: error.message,
      logs,
    };
  }
}

/**
 * Plan task execution
 */
async function planTask(taskDescription, budget) {
  // Simple rule-based planning for demo
  const lowerTask = taskDescription.toLowerCase();
  const services = [];

  // Determine required services based on task
  if (lowerTask.includes('pdf') || lowerTask.includes('document')) {
    // Choose PDF parser based on budget
    if (budget >= 2000000) {
      services.push(SERVICE_CATALOG.find(s => s.id === 'pdf-parser-premium'));
    } else {
      services.push(SERVICE_CATALOG.find(s => s.id === 'pdf-parser-cheap'));
    }
  }

  if (lowerTask.includes('summarize') || lowerTask.includes('summary')) {
    // Choose summarizer based on remaining budget
    const usedBudget = services.reduce((sum, s) => sum + s.cost, 0);
    const remaining = budget - usedBudget;

    if (remaining >= 1500000) {
      services.push(SERVICE_CATALOG.find(s => s.id === 'llm-summarize-premium'));
    } else {
      services.push(SERVICE_CATALOG.find(s => s.id === 'llm-summarize-cheap'));
    }
  }

  return {
    services,
    reasoning: `Selected ${services.length} service(s) based on task requirements and budget`,
  };
}

/**
 * Optimize plan to fit budget
 */
async function optimizePlan(originalPlan, budget) {
  const optimizedServices = [];

  for (const service of originalPlan.services) {
    // Find cheaper alternative
    const cheaper = SERVICE_CATALOG.find(
      s => s.vendor === service.vendor && s.cost < service.cost
    ) || SERVICE_CATALOG.find(
      s => s.id.includes(service.id.split('-')[0]) && s.cost < service.cost
    );

    if (cheaper) {
      optimizedServices.push(cheaper);
    } else {
      optimizedServices.push(service);
    }
  }

  return {
    services: optimizedServices,
    reasoning: 'Optimized by selecting cheaper service alternatives',
  };
}

/**
 * Get service catalog
 */
export function getServiceCatalog() {
  return SERVICE_CATALOG;
}

/**
 * Get service by ID
 */
export function getServiceById(serviceId) {
  return SERVICE_CATALOG.find(s => s.id === serviceId);
}
