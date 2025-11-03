import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { StatCard } from '../Shared/StatCard';
import { apiService, RegulatoryProof } from '../../services/api';

export default function RegulatoryOversight() {
  const [pendingReviews, setPendingReviews] = useState<RegulatoryProof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  async function loadPendingReviews() {
    try {
      const reviews = await apiService.getPendingReviews();
      setPendingReviews(reviews);
      setLoading(false);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
      setLoading(false);
    }
  }

  async function handleApprove(proofId: string) {
    try {
      await apiService.approveProof(proofId);
      await loadPendingReviews();
      alert(`Proof ${proofId} approved successfully`);
    } catch (error) {
      alert(`Error approving proof: ${error}`);
    }
  }

  async function handleReject(proofId: string, reason: string) {
    if (!reason) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await apiService.rejectProof(proofId, reason);
      await loadPendingReviews();
      alert(`Proof ${proofId} rejected`);
    } catch (error) {
      alert(`Error rejecting proof: ${error}`);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MAS Regulatory Oversight</h1>
          <p className="text-gray-600 mt-2">Monitor and review AI cognitive activities</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Configure Policies
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Today" value="1,247" color="blue" icon={FileText} />
        <StatCard label="Auto-Approved" value="1,195" color="green" percentage="95.8%" icon={CheckCircle} />
        <StatCard label="Pending Review" value={pendingReviews.length.toString()} color="yellow" icon={Clock} />
        <StatCard label="Rejected" value="4" color="red" icon={AlertCircle} />
        <StatCard label="Avg Review Time" value="2.3h" color="purple" icon={TrendingUp} />
      </div>

      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Regulatory Reviews ({pendingReviews.length})
          </h2>
        </div>
        <div className="p-6 space-y-3">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : pendingReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No pending reviews</div>
          ) : (
            pendingReviews.map(proof => (
              <div 
                key={proof.id} 
                className={`border rounded-lg p-4 ${proof.priority === 'high' ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{proof.id}</code>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        proof.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {proof.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Agent:</strong> {proof.agent}</div>
                      <div><strong>Value:</strong> {proof.value}</div>
                      <div><strong>Flag Reason:</strong> {proof.reason}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert(`Proof Details:\nID: ${proof.id}\nAgent: ${proof.agent}\nValue: ${proof.value}\nReason: ${proof.reason}`)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Review
                    </button>
                    <button 
                      onClick={() => handleApprove(proof.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleReject(proof.id, reason);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
