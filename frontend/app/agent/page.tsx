'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useState, useEffect } from 'react';
import { executeAgentTask, attemptAgentPayment, getAgentLogs, getAgentServices, type AgentLog, type AgentService, type AgentTaskResult } from '@/lib/api';
import { 
  Bot, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  DollarSign,
  Activity,
  Play,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgentConsolePage() {
  const { accountAddress, isConnected } = useWallet();
  const [taskDescription, setTaskDescription] = useState('');
  const [budget, setBudget] = useState('1');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [services, setServices] = useState<AgentService[]>([]);
  const [currentResult, setCurrentResult] = useState<AgentTaskResult | null>(null);

  useEffect(() => {
    if (isConnected && accountAddress) {
      loadServices();
      loadLogs();
    }
  }, [isConnected, accountAddress]);

  const loadServices = async () => {
    try {
      const servicesData = await getAgentServices();
      setServices(servicesData);
    } catch (error: any) {
      console.error('Error loading services:', error);
    }
  };

  const loadLogs = async () => {
    if (!accountAddress) return;
    try {
      const logsData = await getAgentLogs(accountAddress, undefined, 50);
      setLogs(logsData);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      // Don't show error toast for empty logs, just set empty array
      setLogs([]);
    }
  };

  const handleExecuteTask = async () => {
    if (!accountAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!taskDescription.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    const budgetMicroAlgo = Math.floor(parseFloat(budget) * 1_000_000);
    if (budgetMicroAlgo <= 0) {
      toast.error('Budget must be greater than 0');
      return;
    }

    setIsExecuting(true);
    setCurrentResult(null);

    try {
      // Execute agent task with x402 automatic payment
      toast.loading('Agent is planning and executing payment...', { duration: 2000 });
      
      const result = await executeAgentTask(taskDescription, budgetMicroAlgo, accountAddress);
      setCurrentResult(result);
      
      // Reload logs to show all activity
      await loadLogs();

      if (result.status === 'executed') {
        toast.success('Task executed successfully with automatic payment!');
      } else if (result.status === 'planned' || result.status === 'optimized') {
        toast.success('Task planned successfully!');
      } else {
        toast.error('Task execution failed');
      }
    } catch (error: any) {
      console.error('Error executing task:', error);
      toast.error(error.message || 'Failed to execute task');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAttemptPayment = async (service: AgentService) => {
    if (!accountAddress || !currentResult) return;

    try {
      const decision = await attemptAgentPayment(
        currentResult.agentId,
        accountAddress,
        service.vendor,
        service.cost,
        { serviceId: service.id, serviceName: service.name }
      );

      await loadLogs();

      if (decision.status === 'approved') {
        toast.success(`Payment approved: ${service.name}`);
      } else if (decision.status === 'blocked') {
        toast.error(`Payment blocked: ${decision.reason}`);
      } else if (decision.status === 'modified') {
        toast.error(`Payment modified: ${decision.reason}`);
      }
    } catch (error: any) {
      console.error('Error attempting payment:', error);
      toast.error(error.message || 'Failed to attempt payment');
    }
  };

  const getLogIcon = (logType: string) => {
    switch (logType) {
      case 'task_start':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'planning':
        return <Bot className="w-4 h-4 text-purple-600" />;
      case 'payment_attempt':
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      case 'payment_approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'payment_blocked':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'payment_modified':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'optimization':
        return <Zap className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getLogColor = (logType: string) => {
    switch (logType) {
      case 'payment_approved':
        return 'bg-green-50 border-green-200';
      case 'payment_blocked':
        return 'bg-red-50 border-red-200';
      case 'payment_modified':
        return 'bg-orange-50 border-orange-200';
      case 'planning':
        return 'bg-purple-50 border-purple-200';
      case 'optimization':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-neutral-50 border-neutral-200';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <Bot className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">AI Agent Console</h2>
          <p className="text-neutral-600 mb-6">Connect your wallet to access the AI agent</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">AI Agent Console</h1>
          </div>
          <p className="text-neutral-600">Autonomous payment guardian with intelligent spending control</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Task Execution */}
          <div className="space-y-6">
            {/* Task Input */}
            <div className="enterprise-card p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Execute Task</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Task Description
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="e.g., Summarize PDF under 1 ALGO"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={isExecuting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Budget (ALGO)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="1.0"
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isExecuting}
                  />
                </div>

                <button
                  onClick={handleExecuteTask}
                  disabled={isExecuting}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Execute Task</span>
                    </>
                  )}
                </button>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    ⚡ <strong>x402 Automatic Payment:</strong> The agent will select the cheapest service and execute payment automatically using the x402 protocol. No approval needed!
                  </p>
                </div>
              </div>
            </div>

            {/* Current Result */}
            {currentResult && (
              <div className="enterprise-card p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Task Result</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-600">Status:</span>
                    <span className={`badge ${
                      currentResult.status === 'executed' ? 'badge-success' :
                      currentResult.status === 'planned' ? 'badge-success' :
                      currentResult.status === 'optimized' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {currentResult.status}
                    </span>
                    {currentResult.paymentResult?.protocol === 'x402' && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                        x402
                      </span>
                    )}
                  </div>

                  {/* Payment Result */}
                  {currentResult.paymentResult && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 mb-1">Payment Executed Successfully!</h3>
                          <p className="text-sm text-green-800">{currentResult.paymentResult.message}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Transaction ID:</span>
                          <a 
                            href={`https://testnet.algoexplorer.io/tx/${currentResult.paymentResult.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-mono text-xs"
                          >
                            {currentResult.paymentResult.txId.substring(0, 8)}...
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Amount:</span>
                          <span className="font-semibold text-neutral-900">
                            {currentResult.selectedService ? (currentResult.selectedService.cost / 1_000_000).toFixed(2) : '0'} ALGO
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Confirmed Round:</span>
                          <span className="font-medium text-neutral-900">
                            {currentResult.paymentResult.confirmedRound}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Service */}
                  {currentResult.selectedService && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">Selected Service</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">{currentResult.selectedService.name}</p>
                          <p className="text-sm text-neutral-600">{currentResult.selectedService.vendor}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-neutral-900">
                            {(currentResult.selectedService.cost / 1_000_000).toFixed(2)} ALGO
                          </p>
                          <p className="text-xs text-neutral-500">
                            To: {currentResult.selectedService.walletAddress?.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentResult.plan && (
                    <>
                      <div>
                        <p className="text-sm text-neutral-600 mb-2">{currentResult.plan.reasoning}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-2">Available Services:</h3>
                        <div className="space-y-2">
                          {currentResult.plan.services.map((service, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                              <div>
                                <p className="font-medium text-neutral-900">{service.name}</p>
                                <p className="text-sm text-neutral-600">{service.vendor}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-neutral-900">{(service.cost / 1_000_000).toFixed(2)} ALGO</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {currentResult.totalCost !== undefined && (
                        <div className="pt-3 border-t border-neutral-200">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-900">Total Cost:</span>
                            <span className="text-lg font-bold text-neutral-900">
                              {(currentResult.totalCost / 1_000_000).toFixed(2)} ALGO
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Available Services */}
            <div className="enterprise-card p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Available Services</h2>
              <div className="space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">{service.name}</p>
                      <p className="text-sm text-neutral-600">{service.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900">{(service.cost / 1_000_000).toFixed(2)} ALGO</p>
                      <p className="text-xs text-neutral-500">{service.vendor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Agent Logs */}
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Agent Activity Log</h2>
              <button
                onClick={loadLogs}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3 max-h-[800px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium mb-1">No agent activity yet</p>
                  <p className="text-sm text-neutral-400 mt-1">Execute a task to see agent logs</p>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-sm mx-auto">
                    <p className="text-xs text-blue-800">
                      <strong>Tip:</strong> Create spending rules first, then execute a task to see the AI agent in action!
                    </p>
                  </div>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`p-4 border rounded-lg ${getLogColor(log.logType)}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getLogIcon(log.logType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-neutral-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-white border border-neutral-200 rounded-full font-medium text-neutral-700">
                            {log.logType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-900 font-medium">{log.message}</p>
                        {log.data && Object.keys(log.data).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-neutral-600 cursor-pointer hover:text-neutral-900">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-white p-2 rounded border border-neutral-200 overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
