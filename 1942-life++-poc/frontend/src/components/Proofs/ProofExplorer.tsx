/**
 * Proof Explorer Component
 * 
 * A comprehensive interface for browsing, searching, and viewing cognitive proofs
 * submitted to the blockchain. Provides search functionality, status filtering,
 * and detailed proof information including chain data, verification status,
 * and attestations.
 * 
 * @module ProofExplorer
 * @description Browse and explore all cognitive proofs with search and filter capabilities
 */

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Copy, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../Shared/StatusBadge';
import { apiService, Proof } from '../../services/api';

/**
 * Proof Explorer Component
 * 
 * Features:
 * - Search proofs by ID or agent name (manual trigger via button or Enter key)
 * - Filter by verification status (verified, pending, rejected)
 * - Sort proofs by time (newest first)
 * - View detailed proof information in modal
 * - Copy proof IDs and hashes to clipboard
 * - Open IPFS metadata links
 */
export default function ProofExplorer() {
  // State: Search input value for filtering proofs
  const [searchTerm, setSearchTerm] = useState('');
  
  // State: Current status filter selection ('all', 'verified', 'pending', 'rejected')
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Remove time range selection; default to backend latest results
  
  // State: Array of proof objects fetched from backend
  const [proofs, setProofs] = useState<Proof[]>([]);
  
  // State: Loading indicator for initial proof list loading
  const [loading, setLoading] = useState(true);
  
  // State: Currently selected proof for detail view modal
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  
  // State: Detailed proof data fetched from backend (includes chain data)
  const [proofDetails, setProofDetails] = useState<any>(null);
  
  // State: Loading indicator for proof detail modal
  const [loadingDetails, setLoadingDetails] = useState(false);

  /**
   * Effect: Auto-load proofs when filter status or time range changes
   * 
   * Note: searchTerm is intentionally excluded from dependencies to allow
   * manual search trigger via button or Enter key, preventing excessive API calls.
   */
  useEffect(() => {
    loadProofs();
  }, [filterStatus]);

  /**
   * Load Proofs from Backend
   * 
   * Fetches proofs from the API with optional search, status, and time range filters.
   * The search parameter is only included if searchTerm has a value.
   * If no real data is returned (empty array), displays mock data to prevent
   * page from being stuck in loading state.
   * 
   * @async
   */
  async function loadProofs() {
    try {
      const params: any = {
        search: searchTerm || undefined, // Only include search if term exists
        status: filterStatus !== 'all' ? filterStatus : undefined // Only include status if not 'all'
      };
      
      // No time parameters: backend returns all/latest, frontend再排序
    const data = await apiService.getProofs(params);
    // Real data only: no mock fallback
    let filteredData = data;
    if (filterStatus !== 'all') {
      filteredData = data.filter((proof) => proof.status === filterStatus);
      console.log(`Applied status filter "${filterStatus}" to real data: ${filteredData.length} proofs`);
    }
    setProofs(filteredData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading proofs:', error);
      // On error, do not use mock; show empty
      setProofs([]);
      setLoading(false);
    }
  }

  /**
   * Parse Time String to Timestamp
   * 
   * Converts human-readable time strings (e.g., "13d ago", "2h ago", "just now")
   * into numeric timestamps for sorting and comparison purposes.
   * 
   * @param timeStr - Time string in format: "{number}{unit} ago" or "just now"
   * @returns Numeric timestamp (milliseconds since epoch) or 0 if parsing fails
   * 
   * Supported formats:
   * - "just now" -> current time
   * - "13d ago" -> 13 days ago
   * - "2h ago" -> 2 hours ago
   * - "30m ago" -> 30 minutes ago
   * - "45s ago" -> 45 seconds ago
   */
  function parseTimeToTimestamp(timeStr: string): number {
    if (timeStr === 'just now') return Date.now();
    
    const match = timeStr.match(/(\d+)([dhms])/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const now = Date.now();
    switch (unit) {
      case 'd': return now - value * 24 * 60 * 60 * 1000;      // Days
      case 'h': return now - value * 60 * 60 * 1000;           // Hours
      case 'm': return now - value * 60 * 1000;               // Minutes
      case 's': return now - value * 1000;                     // Seconds
      default: return 0;
    }
  }

  /**
   * Sorted Proofs (Memoized)
   * 
   * Returns proofs sorted by time in descending order (newest first).
   * Uses useMemo to avoid re-sorting on every render when proofs haven't changed.
   * 
   * @returns Array of proofs sorted by timestamp (newest to oldest)
   */
  const sortedProofs = useMemo(() => {
    return [...proofs].sort((a, b) => {
      const timeA = parseTimeToTimestamp(a.time);
      const timeB = parseTimeToTimestamp(b.time);
      return timeB - timeA; // Descending order: newest first
    });
  }, [proofs]);

  /**
   * Handle View Details Action
   * 
   * Opens the proof detail modal and fetches comprehensive proof information
   * from the blockchain, including chain data, attestations, and metadata.
   * 
   * @param proof - Proof object to view details for
   * @async
   */
  async function handleViewDetails(proof: Proof) {
    setSelectedProof(proof);
    setLoadingDetails(true);
    try {
      const details = await apiService.getProof(proof.id);
      setProofDetails(details);
    } catch (error) {
      console.error('Error loading proof details:', error);
      setProofDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  /**
   * Handle Close Modal Action
   * 
   * Clears the selected proof and detail data to close the modal.
   */
  function handleCloseModal() {
    setSelectedProof(null);
    setProofDetails(null);
  }

  /**
   * Copy Text to Clipboard
   * 
   * Utility function to copy text to the system clipboard.
   * Shows a simple alert confirmation (could be enhanced with toast notifications).
   * 
   * @param text - Text string to copy to clipboard
   */
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  return (
    <div className="p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Proof Explorer</h1>
        <p className="text-gray-600 mt-2">Browse and search all cognitive proofs</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[300px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Proof ID, Agent ID, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  loadProofs();
                }
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          
          {/* Status Filter */}
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          
          {/* Time Range Selector removed to use default latest results */}
          
          <button
            onClick={loadProofs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow pb-8">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : proofs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No proofs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proof ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validators</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedProofs.map(proof => (
                  <tr key={proof.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <code 
                        className="text-sm truncate max-w-[200px] block cursor-help" 
                        title={proof.id}
                      >
                        {proof.id}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm truncate max-w-[150px]" title={proof.agent}>
                      {proof.agent}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={proof.status} />
                    </td>
                    <td className="px-6 py-4 text-sm">{proof.value}</td>
                    <td className="px-6 py-4 text-sm">{proof.validators}/5</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{proof.time}</td>
                    <td className="px-6 py-4 relative z-10">
                      <button 
                        onClick={() => handleViewDetails(proof)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium relative z-10 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Details Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Proof Details</h2>
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
              ) : proofDetails ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-gray-600">Proof ID:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded max-w-[400px] truncate">
                            {proofDetails.proofId || selectedProof.id}
                          </code>
                          <button 
                            onClick={() => copyToClipboard(proofDetails.proofId || selectedProof.id)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <StatusBadge status={selectedProof.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Agent:</span>
                        <span className="text-sm font-medium">{selectedProof.agent}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Validators:</span>
                        <span className="text-sm">{selectedProof.validators}/5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="text-sm font-medium">{selectedProof.value}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="text-sm text-gray-500">{selectedProof.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chain Data */}
                  {proofDetails.cid ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Chain Data</h3>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-gray-600">CID:</span>
                          <div className="flex items-center gap-2 max-w-[400px]">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1">
                              {proofDetails.cid}
                            </code>
                            <button 
                              onClick={() => copyToClipboard(proofDetails.cid)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {proofDetails.inputHash && (
                          <div className="flex items-start justify-between">
                            <span className="text-gray-600">Input Hash:</span>
                            <div className="flex items-center gap-2 max-w-[400px]">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1">
                                {proofDetails.inputHash}
                              </code>
                              <button 
                                onClick={() => copyToClipboard(proofDetails.inputHash)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        {proofDetails.reasoningHash && (
                          <div className="flex items-start justify-between">
                            <span className="text-gray-600">Reasoning Hash:</span>
                            <div className="flex items-center gap-2 max-w-[400px]">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1">
                                {proofDetails.reasoningHash}
                              </code>
                              <button 
                                onClick={() => copyToClipboard(proofDetails.reasoningHash)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        {proofDetails.outputHash && (
                          <div className="flex items-start justify-between">
                            <span className="text-gray-600">Output Hash:</span>
                            <div className="flex items-center gap-2 max-w-[400px]">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1">
                                {proofDetails.outputHash}
                              </code>
                              <button 
                                onClick={() => copyToClipboard(proofDetails.outputHash)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        {proofDetails.metadataCID && (
                          <div className="flex items-start justify-between">
                            <span className="text-gray-600">Metadata CID (IPFS):</span>
                            <div className="flex items-center gap-2 max-w-[400px]">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1">
                                {proofDetails.metadataCID}
                              </code>
                              <button 
                                onClick={() => copyToClipboard(proofDetails.metadataCID)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <a 
                                href={`https://ipfs.io/ipfs/${proofDetails.metadataCID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                                title="View on IPFS"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        )}
                        {proofDetails.timestamp && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Timestamp:</span>
                            <span className="text-sm">
                              {new Date(Number(proofDetails.timestamp) * 1000).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {proofDetails.chainRank !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">ChainRank:</span>
                            <span className="text-sm font-medium text-green-600">
                              {proofDetails.chainRank.toString()}
                            </span>
                          </div>
                        )}
                        {proofDetails.attestedBy && proofDetails.attestedBy.length > 0 && (
                          <div className="flex items-start justify-between">
                            <span className="text-gray-600">Attested By:</span>
                            <div className="flex flex-col gap-1 max-w-[400px]">
                              {proofDetails.attestedBy.map((addr: string, idx: number) => (
                                <code key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded truncate">
                                  {addr}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No detailed data available
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load proof details
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
