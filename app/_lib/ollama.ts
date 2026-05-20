/**
 * Ollama integration for real LLM-powered planning and execution.
 *
 * Uses the Ollama REST API directly (no SDK needed).
 * Ollama must be running locally: `ollama serve`
 * Models: `ollama pull llama3` / `ollama pull deepseek-r1`
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'llama3';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Calls Ollama chat completion API.
 * Returns the assistant's response text.
 */
export async function ollamaChat(
  messages: OllamaMessage[],
  model: string = DEFAULT_MODEL,
  timeoutMs = 30000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.3 },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as { message: { content: string } };
    return data.message.content.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Checks if Ollama is running and the model is available.
 */
export async function isOllamaAvailable(model: string = DEFAULT_MODEL): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data = await res.json() as { models: Array<{ name: string }> };
    return data.models.some(m => m.name.startsWith(model.split(':')[0]));
  } catch {
    return false;
  }
}

// ─── Planner ─────────────────────────────────────────────────────────────────

export interface PlannedStep {
  task: string;
  requiredAgent: string;
  reasoning: string;
}

/**
 * Uses Ollama to decompose a user request into workflow steps.
 * Falls back to keyword-based planning if Ollama is unavailable.
 */
export async function planWorkflow(userRequest: string): Promise<PlannedStep[]> {
  const ollamaAvailable = await isOllamaAvailable();

  if (ollamaAvailable) {
    return planWithOllama(userRequest);
  }

  // Fallback: keyword-based planner
  return planWithKeywords(userRequest);
}

async function planWithOllama(userRequest: string): Promise<PlannedStep[]> {
  const systemPrompt = `You are an AI workflow planner for an autonomous agent marketplace.
Your job is to decompose user requests into a sequence of tasks that specialized AI agents can execute.

Available agent types:
- research-agent: web research, data gathering, analysis
- writer-agent: writing reports, content, documentation
- visualization-agent: charts, graphs, data visualization
- summarizer-agent: summarizing documents, PDFs, text
- negotiator-agent: price negotiation, contract optimization

Respond ONLY with a valid JSON array. No explanation, no markdown, just JSON.
Each item must have: { "task": string, "requiredAgent": string, "reasoning": string }

Example:
[
  {"task": "research AI IDE market", "requiredAgent": "research-agent", "reasoning": "Need current market data"},
  {"task": "write analysis report", "requiredAgent": "writer-agent", "reasoning": "Synthesize findings into report"}
]`;

  try {
    const response = await ollamaChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Decompose this request into workflow steps: "${userRequest}"` },
    ]);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in response');

    const steps = JSON.parse(jsonMatch[0]) as PlannedStep[];
    if (!Array.isArray(steps) || steps.length === 0) throw new Error('Empty steps array');

    return steps;
  } catch (err) {
    console.warn('Ollama planning failed, falling back to keyword planner:', err);
    return planWithKeywords(userRequest);
  }
}

function planWithKeywords(userRequest: string): PlannedStep[] {
  const req = userRequest.toLowerCase();
  const steps: PlannedStep[] = [];

  if (/research|analys|data|market|competi|trend|find|search/.test(req)) {
    steps.push({
      task: 'Research and gather data',
      requiredAgent: 'research-agent',
      reasoning: 'Request requires data gathering and research',
    });
  }

  if (/chart|graph|visual|plot|diagram/.test(req)) {
    steps.push({
      task: 'Generate visualizations',
      requiredAgent: 'visualization-agent',
      reasoning: 'Request requires visual data representation',
    });
  }

  if (/summar|condense|tldr|brief/.test(req)) {
    steps.push({
      task: 'Summarize content',
      requiredAgent: 'summarizer-agent',
      reasoning: 'Request requires summarization',
    });
  }

  if (/report|write|document|article|content|draft/.test(req)) {
    steps.push({
      task: 'Write final report',
      requiredAgent: 'writer-agent',
      reasoning: 'Request requires written output',
    });
  }

  if (steps.length === 0) {
    steps.push({
      task: 'Research and analyze',
      requiredAgent: 'research-agent',
      reasoning: 'General research task',
    });
    steps.push({
      task: 'Write summary report',
      requiredAgent: 'writer-agent',
      reasoning: 'Produce written output',
    });
  }

  return steps;
}

// ─── Agent Executor ───────────────────────────────────────────────────────────

/**
 * Executes a task using Ollama with the appropriate model for the agent type.
 * Falls back to a structured mock result if Ollama is unavailable.
 */
export async function executeAgentTask(
  agentType: string,
  task: string,
  model: string,
  context?: string
): Promise<string> {
  const ollamaAvailable = await isOllamaAvailable(model);

  if (ollamaAvailable) {
    return executeWithOllama(agentType, task, model, context);
  }

  return generateFallbackResult(agentType, task);
}

async function executeWithOllama(
  agentType: string,
  task: string,
  model: string,
  context?: string
): Promise<string> {
  const systemPrompts: Record<string, string> = {
    'research-agent': 'You are a research AI agent. Provide detailed, factual research findings with key data points, trends, and insights. Be concise but comprehensive.',
    'writer-agent': 'You are a professional writing AI agent. Produce well-structured, clear written content. Use headers and bullet points where appropriate.',
    'visualization-agent': 'You are a data visualization AI agent. Describe the charts and graphs you would create, including data structure, chart types, and key insights they would reveal.',
    'summarizer-agent': 'You are a summarization AI agent. Produce concise, accurate summaries that capture the essential information.',
    'negotiator-agent': 'You are a negotiation AI agent. Analyze pricing and provide optimal negotiation strategies.',
  };

  const systemPrompt = systemPrompts[agentType] ?? 'You are a helpful AI agent. Complete the given task.';

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (context) {
    messages.push({ role: 'user', content: `Context from previous steps:\n${context}` });
    messages.push({ role: 'assistant', content: 'Understood. I will use this context.' });
  }

  messages.push({ role: 'user', content: `Task: ${task}` });

  return ollamaChat(messages, model, 60000);
}

function generateFallbackResult(agentType: string, task: string): string {
  const templates: Record<string, string> = {
    'research-agent': `## Research Findings: ${task}\n\n**Key Findings:**\n- Market analysis indicates strong growth trajectory\n- Primary competitors identified with differentiated positioning\n- Technology trends favor decentralized, agent-native architectures\n\n**Data Points:**\n- Market size: $2.4B (2024), projected $12B by 2028\n- YoY growth: 38%\n- Key players: 15 identified, 3 dominant\n\n*Note: Ollama unavailable — results are illustrative. Start Ollama for real AI execution.*`,
    'writer-agent': `## Report: ${task}\n\n### Executive Summary\nThis report synthesizes research findings into actionable insights for stakeholders.\n\n### Key Insights\n1. The market demonstrates strong fundamentals with clear growth vectors\n2. Autonomous agent infrastructure represents a paradigm shift\n3. x402 payment protocol enables frictionless machine-to-machine commerce\n\n### Recommendations\n- Prioritize agent registry infrastructure\n- Implement x402 payment gating on all API endpoints\n- Build reputation system for trust establishment\n\n*Note: Ollama unavailable — results are illustrative.*`,
    'visualization-agent': `## Visualization Plan: ${task}\n\n**Chart 1: Market Growth (Line Chart)**\n- X-axis: 2020–2028\n- Y-axis: Market size ($B)\n- Series: Total market, AI agents segment\n\n**Chart 2: Competitive Landscape (Radar Chart)**\n- Dimensions: Price, Speed, Reliability, Features, Ecosystem\n- Entities: AgentWallet vs competitors\n\n**Chart 3: Transaction Volume (Bar Chart)**\n- X-axis: Monthly periods\n- Y-axis: USDC volume\n- Color: By agent type\n\n*Note: Ollama unavailable — results are illustrative.*`,
    'summarizer-agent': `## Summary: ${task}\n\n**TL;DR:** The subject matter covers autonomous AI agent economics with x402 payment infrastructure on Algorand.\n\n**Key Points:**\n- Agents transact autonomously using HTTP 402 payment flows\n- Algorand provides 2.8s finality at 0.001 ALGO fees\n- USDC (ASA 10458941 on testnet) is the settlement currency\n\n*Note: Ollama unavailable — results are illustrative.*`,
  };

  return templates[agentType] ?? `## Task Completed: ${task}\n\nTask executed successfully by ${agentType}.\n\n*Note: Ollama unavailable — start Ollama for real AI execution.*`;
}

// ─── Negotiator ───────────────────────────────────────────────────────────────

/**
 * Uses Ollama (deepseek-r1 or llama3) to negotiate pricing.
 * Falls back to rule-based negotiation.
 */
export async function negotiatePrice(
  agentName: string,
  initialPrice: number,
  budget: number
): Promise<{ counter: number; finalPrice: number; reasoning: string }> {
  if (initialPrice <= budget) {
    return {
      counter: initialPrice,
      finalPrice: initialPrice,
      reasoning: 'Price within budget — accepted at asking price.',
    };
  }

  const ollamaAvailable = await isOllamaAvailable('deepseek-r1');

  if (ollamaAvailable) {
    try {
      const response = await ollamaChat(
        [
          {
            role: 'system',
            content: 'You are an AI procurement negotiator. Respond ONLY with JSON: {"counter": number, "finalPrice": number, "reasoning": string}',
          },
          {
            role: 'user',
            content: `Agent "${agentName}" asks ${initialPrice} USDC. Budget is ${budget} USDC. Negotiate.`,
          },
        ],
        'deepseek-r1',
        15000
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as { counter: number; finalPrice: number; reasoning: string };
        return result;
      }
    } catch {
      // fall through to rule-based
    }
  }

  // Rule-based fallback
  const counter = parseFloat((initialPrice * 0.8).toFixed(6));
  const finalPrice = parseFloat(((initialPrice + counter) / 2).toFixed(6));
  return {
    counter,
    finalPrice,
    reasoning: `Counter-offered at 80% (${counter} USDC). Settled at midpoint: ${finalPrice} USDC.`,
  };
}
