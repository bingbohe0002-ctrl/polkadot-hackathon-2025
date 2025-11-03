import { useState, useEffect } from 'react';
import { CheckCircle, Shield, AlertCircle, FileText } from 'lucide-react';
import { StatCard } from '../Shared/StatCard';
import { apiService } from '../../services/api';

interface ComplianceItemProps {
  label: string;
  status: string;
  lastCheck: string;
  healthy: boolean;
}

function ComplianceItem({ label, status, lastCheck, healthy }: ComplianceItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${healthy ? 'bg-green-500' : 'bg-red-500'}`} />
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-gray-500">{status}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500">{lastCheck}</div>
    </div>
  );
}

export default function ComplianceCenter() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const data = await apiService.getComplianceStatus();
      setStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading compliance status:', error);
      setLoading(false);
    }
  }

  if (loading || !status) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compliance Center</h1>
        <p className="text-gray-600 mt-2">KYC/AML monitoring and regulatory reporting</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="KYC Verified" value={status.kycVerified.toString()} icon={CheckCircle} color="green" percentage="100%" />
        <StatCard label="AML Checks" value={status.amlChecks.toLocaleString()} icon={Shield} color="blue" />
        <StatCard label="Flagged Cases" value={status.flaggedCases.toString()} icon={AlertCircle} color="yellow" />
        <StatCard label="Reports Generated" value={status.reportsGenerated.toString()} icon={FileText} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          AML Monitoring Status
        </h3>
        <div className="space-y-4">
          <ComplianceItem 
            label="Chainalysis Integration" 
            status={status.monitoring.chainalysis.status} 
            lastCheck={status.monitoring.chainalysis.lastCheck}
            healthy={status.monitoring.chainalysis.healthy}
          />
          <ComplianceItem 
            label="TRM Labs Feed" 
            status={status.monitoring.trmLabs.status} 
            lastCheck={status.monitoring.trmLabs.lastCheck}
            healthy={status.monitoring.trmLabs.healthy}
          />
          <ComplianceItem 
            label="Sanctions Screening" 
            status={status.monitoring.sanctions.status} 
            lastCheck={status.monitoring.sanctions.lastCheck}
            healthy={status.monitoring.sanctions.healthy}
          />
          <ComplianceItem 
            label="PEP Screening" 
            status={status.monitoring.pep.status} 
            lastCheck={status.monitoring.pep.lastCheck}
            healthy={status.monitoring.pep.healthy}
          />
        </div>
      </div>
    </div>
  );
}
