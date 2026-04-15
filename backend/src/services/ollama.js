/**
 * Ollama AI Service
 * Stage 2: AI Rule Creation
 */
import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

/**
 * Parse natural language input into structured rule
 * @param {string} input - Natural language rule description
 * @returns {Promise<{vendor: string, maxAmount: number}>}
 */
export async function parseRuleWithAI(input) {
  const prompt = `You are a payment rule parser. Convert the user's natural language input into a structured JSON rule.

Extract:
1. vendor: The merchant/vendor name (e.g., "Swiggy", "Zomato", "Amazon")
2. maxAmount: The maximum amount in microAlgos (1 ALGO = 1,000,000 microAlgos)

Rules for conversion:
- If amount is in ALGO, multiply by 1,000,000 to get microAlgos
- If amount is in INR (₹), assume 1 ALGO = ₹80 for conversion, then convert to microAlgos
- If amount is in USD ($), assume 1 ALGO = $0.25 for conversion, then convert to microAlgos
- Extract vendor name exactly as mentioned
- If no amount specified, use a reasonable default (e.g., 100 ALGO = 100,000,000 microAlgos)

User input: "${input}"

Respond ONLY with valid JSON in this exact format:
{
  "vendor": "VendorName",
  "maxAmount": 300000000
}

Do not include any explanation, just the JSON.`;

  try {
    const response = await ollama.generate({
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      prompt,
      stream: false,
    });

    // Extract JSON from response
    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const rule = JSON.parse(jsonMatch[0]);

    // Validate the rule structure
    if (!rule.vendor || typeof rule.vendor !== 'string') {
      throw new Error('Invalid vendor in parsed rule');
    }

    if (
      rule.maxAmount === undefined ||
      typeof rule.maxAmount !== 'number' ||
      rule.maxAmount <= 0
    ) {
      throw new Error('Invalid maxAmount in parsed rule');
    }

    return rule;
  } catch (error) {
    console.error('Ollama parsing error:', error);
    throw new Error(`Failed to parse rule with AI: ${error.message}`);
  }
}

/**
 * Test Ollama connection
 */
export async function testOllamaConnection() {
  try {
    const response = await ollama.generate({
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      prompt: 'Say "OK" if you can read this.',
      stream: false,
    });
    return response.response.includes('OK');
  } catch (error) {
    console.error('Ollama connection test failed:', error);
    return false;
  }
}
