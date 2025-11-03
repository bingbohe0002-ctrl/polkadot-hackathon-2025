import { useState, useEffect } from 'react';
import { Activity, CheckCircle, TrendingUp, Award } from 'lucide-react';
import { StatCard } from '../Shared/StatCard';
import { apiService, Validator } from '../../services/api';

export default function ValidatorNetwork() {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValidators();
  }, []);

  async function loadValidators() {
    try {
      const data = await apiService.getValidators();
      setValidators(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading validators:', error);
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Validator Network</h1>
        <p className="text-gray-600 mt-2">Monitor validator performance and attestations</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Validators" value="5" icon={Activity} color="blue" />
        <StatCard label="Online Now" value={`${validators.filter(v => v.status === 'online').length}/5`} icon={CheckCircle} color="green" percentage="100%" />
        <StatCard label="Avg Uptime" value="99.7%" icon={TrendingUp} color="purple" />
        <StatCard label="Total Attestations" value="6.1K" icon={Award} color="orange" />
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {loading ? (
          <div className="col-span-5 text-center py-8">Loading...</div>
        ) : (
          validators.map(v => (
            <div key={v.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div className={`w-2 h-2 rounded-full ${v.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              </div>
              <div className="font-bold text-sm mb-1">{v.id}</div>
              <code className="text-xs text-gray-500">{v.address}</code>
              <div className="mt-3 pt-3 border-t space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Attestations:</span>
                  <span className="font-medium">{v.attestations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium text-green-600">{v.uptime}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
