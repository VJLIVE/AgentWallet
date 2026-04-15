-- AlgoSub Supabase Database Setup
-- Run this in Supabase SQL Editor

-- Create the rules table
CREATE TABLE IF NOT EXISTS rules (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  vendor TEXT NOT NULL,
  max_amount BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one rule per vendor per wallet
  UNIQUE(wallet_address, vendor)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_rules_wallet ON rules(wallet_address);
CREATE INDEX IF NOT EXISTS idx_rules_vendor ON rules(vendor);

-- Enable Row Level Security (RLS)
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
-- Note: In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations" ON rules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'rules'
ORDER BY ordinal_position;

-- Create the agent_logs table for AI agent activity tracking
CREATE TABLE IF NOT EXISTS agent_logs (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  log_type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_logs_wallet ON agent_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_type ON agent_logs(log_type);

-- Enable Row Level Security (RLS)
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
-- Note: In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations on agent_logs" ON agent_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'agent_logs'
ORDER BY ordinal_position;
