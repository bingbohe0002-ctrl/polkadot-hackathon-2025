/**
 * Agent Registry Component
 * 
 * Displays a registry of all registered AI agents in the system. Shows agent
 * information including CID, ChainRank scores, proof counts, and status.
 * Provides detailed view modal for comprehensive agent information.
 * 
 * @module AgentRegistry
 * @description Manage and view registered AI agents and robots
 */

import { useState, useEffect } from 'react';
import { Users, Activity, Award, FileText, Search, X, Copy } from 'lucide-react';
import { StatCard } from '../Shared/StatCard';
import { apiService, Agent } from '../../services/api';

/**
 * Agent Registry Component
 * 
 * Features:
 * - Display all registered agents in card grid layout
 * - Show agent status (active/inactive), ChainRank, and proof counts
 * - View detailed agent information in modal
 * - Copy agent CID and addresses to clipboard
 * - Search functionality (UI prepared, backend integration pending)
 */
export default function AgentRegistry() {
  // State: Array of agent objects fetched from backend
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // State: Loading indicator for initial agent list loading
  const [loading, setLoading] = useState(true);
  
  // State: Currently selected agent for detail view modal
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // State: Detailed agent data fetched from backend
  const [agentDetails, setAgentDetails] = useState<any>(null);
  
  // State: Loading indicator for agent detail modal
  const [loadingDetails, setLoadingDetails] = useState(false);

  /**
   * Effect: Load agents on component mount
   * 
   * Fetches all registered agents from the blockchain when component first renders.
   */
  useEffect(() => {
    loadAgents();
  }, []);

  /**
   * Load Agents from Backend
   * 
   * Fetches all registered agents from the API, including their ChainRank
   * scores and proof submission counts calculated from blockchain data.
   * If no real data is returned (empty array), displays mock data to prevent
   * page from being stuck in loading state.
   * 
   * @async
   */
  async function loadAgents() {
    try {
      const data = await apiService.getAgents();
      // If no real data, use mock data for demonstration
      if (data.length === 0) {
        console.log('No real agents found, displaying mock data');
        setAgents(apiService.generateMockAgents(6));
      } else {
        setAgents(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading agents:', error);
      // On error, show mock data instead of empty state
      setAgents(apiService.generateMockAgents(6));
      setLoading(false);
    }
  }

  /**
   * Handle View Details Action
   * 
   * Opens the agent detail modal and fetches comprehensive agent information
   * from the blockchain, including registration details, stake amount, and metadata.
   * 
   * @param agent - Agent object to view details for
   * @async
   */
  async function handleViewDetails(agent: Agent) {
    setSelectedAgent(agent);
    setLoadingDetails(true);
    try {
      const details = await apiService.getAgent(agent.cid);
      setAgentDetails(details);
    } catch (error) {
      console.error('Error loading agent details:', error);
      setAgentDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  /**
   * Handle Close Modal Action
   * 
   * Clears the selected agent and detail data to close the modal.
   */
  function handleCloseModal() {
    setSelectedAgent(null);
    setAgentDetails(null);
  }

  /**
   * Copy Text to Clipboard
   * 
   * Utility function to copy text to the system clipboard.
   * Shows a simple alert confirmation.
   * 
   * @param text - Text string to copy to clipboard
   */
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  return (
    <div className="p-8 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Registry</h1>
          <p className="text-gray-600 mt-2">Manage registered AI agents and robots</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Register New Agent
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Agents" value="1,247" icon={Users} color="blue" />
        <StatCard label="Active Today" value="892" icon={Activity} color="green" />
        <StatCard label="Avg ChainRank" value="87.5" icon={Award} color="purple" />
        <StatCard label="Total Proofs" value="45.2K" icon={FileText} color="orange" />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 p-6 pb-8">
          {loading ? (
            <div className="col-span-3 text-center py-8">Loading...</div>
          ) : agents.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">No agents found</div>
          ) : (
            agents.map(agent => (
              <div key={agent.cid} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold">{agent.name}</div>
                      <div className="text-xs text-gray-500">{agent.type}</div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600 flex-shrink-0">CID:</span>
                    <code 
                      className="text-xs truncate max-w-[200px] cursor-help" 
                      title={agent.cid}
                    >
                      {agent.cid}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ChainRank:</span>
                    <span className="font-bold text-green-600">{agent.chainrank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Proofs:</span>
                    <span className="font-medium">{agent.proofs}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleViewDetails(agent)}
                  className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium relative z-10"
                >
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Agent Details</h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {loadingDetails ? (
                <div className="text-center py-8">Loading details...</div>
              ) : agentDetails ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-gray-600">Agent Name:</span>
                        <span className="font-medium">{selectedAgent.name}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-gray-600">CID:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded max-w-[400px] truncate">
                            {selectedAgent.cid}
                          </code>
                          <button 
                            onClick={() => copyToClipboard(selectedAgent.cid)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {agentDetails.agentAddr && (
                        <div className="flex items-start justify-between">
                          <span className="text-gray-600">Agent Address:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded max-w-[400px] truncate">
                              {agentDetails.agentAddr}
                            </code>
                            <button 
                              onClick={() => copyToClipboard(agentDetails.agentAddr)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedAgent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedAgent.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-gray-600">ChainRank:</span>
                        <span className="font-bold text-green-600">{selectedAgent.chainrank}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-gray-600">Total Proofs:</span>
                        <span className="font-medium">{selectedAgent.proofs}</span>
                      </div>
                      {agentDetails.stakeAmount && (
                        <div className="flex items-start justify-between">
                          <span className="text-gray-600">Stake Amount:</span>
                          <span className="font-medium">{agentDetails.stakeAmount}</span>
                        </div>
                      )}
                      {agentDetails.registeredAt && (
                        <div className="flex items-start justify-between">
                          <span className="text-gray-600">Registered At:</span>
                          <span className="font-medium">
                            {new Date(Number(agentDetails.registeredAt) * 1000).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {agentDetails.agentMetaHash && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Metadata</h3>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-gray-600">Agent Meta Hash:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded max-w-[400px] truncate">
                              {agentDetails.agentMetaHash}
                            </code>
                            <button 
                              onClick={() => copyToClipboard(agentDetails.agentMetaHash)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-red-600">Failed to load agent details</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
