/**
 * Supabase Database Service
 * Stage 3: Store Rules
 */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file'
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Save a spending rule to the database
 * @param {Object} rule - Rule object
 * @param {string} rule.walletAddress - User's wallet address
 * @param {string} rule.vendor - Vendor name
 * @param {number} rule.maxAmount - Maximum amount in microAlgos
 * @returns {Promise<Object>} Saved rule
 */
export async function saveRule({ walletAddress, vendor, maxAmount }) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rules')
      .insert([
        {
          wallet_address: walletAddress,
          vendor,
          max_amount: maxAmount,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return {
      id: data.id,
      walletAddress: data.wallet_address,
      vendor: data.vendor,
      maxAmount: data.max_amount,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error saving rule:', error);
    throw error;
  }
}

/**
 * Get all rules for a wallet address
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<Array>} Array of rules
 */
export async function getRulesByWallet(walletAddress) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist or other error, return empty array
      console.error('Error fetching rules:', error);
      return [];
    }

    return (data || []).map((rule) => ({
      id: rule.id,
      walletAddress: rule.wallet_address,
      vendor: rule.vendor,
      maxAmount: rule.max_amount,
      createdAt: rule.created_at,
    }));
  } catch (error) {
    console.error('Error fetching rules:', error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Get a specific rule by vendor and wallet
 * @param {string} walletAddress - User's wallet address
 * @param {string} vendor - Vendor name
 * @returns {Promise<Object|null>} Rule or null if not found
 */
export async function getRuleByVendor(walletAddress, vendor) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('vendor', vendor)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Supabase error: ${error.message}`);
    }

    return data
      ? {
          id: data.id,
          walletAddress: data.wallet_address,
          vendor: data.vendor,
          maxAmount: data.max_amount,
          createdAt: data.created_at,
        }
      : null;
  } catch (error) {
    console.error('Error fetching rule by vendor:', error);
    throw error;
  }
}

/**
 * Delete a rule
 * @param {number} ruleId - Rule ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRule(ruleId) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('rules').delete().eq('id', ruleId);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting rule:', error);
    throw error;
  }
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('rules').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}

/**
 * Save an agent log entry
 * @param {Object} log - Log entry
 * @returns {Promise<Object>} Saved log
 */
export async function saveAgentLog({
  agentId,
  walletAddress,
  logType,
  message,
  data,
  timestamp,
}) {
  try {
    const supabase = getSupabaseClient();
    const { data: logData, error } = await supabase
      .from('agent_logs')
      .insert([
        {
          agent_id: agentId,
          wallet_address: walletAddress,
          log_type: logType,
          message,
          data,
          timestamp: timestamp || new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return {
      id: logData.id,
      agentId: logData.agent_id,
      walletAddress: logData.wallet_address,
      logType: logData.log_type,
      message: logData.message,
      data: logData.data,
      timestamp: logData.timestamp,
    };
  } catch (error) {
    console.error('Error saving agent log:', error);
    throw error;
  }
}

/**
 * Get agent logs for a wallet
 * @param {string} walletAddress - User's wallet address
 * @param {string} agentId - Optional agent ID filter
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of logs
 */
export async function getAgentLogs(walletAddress, agentId = null, limit = 100) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('agent_logs')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist or other error, return empty array
      console.error('Error fetching agent logs:', error);
      return [];
    }

    return (data || []).map((log) => ({
      id: log.id,
      agentId: log.agent_id,
      walletAddress: log.wallet_address,
      logType: log.log_type,
      message: log.message,
      data: log.data,
      timestamp: log.timestamp,
    }));
  } catch (error) {
    console.error('Error fetching agent logs:', error);
    // Return empty array instead of throwing
    return [];
  }
}
