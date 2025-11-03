import { useState, useEffect } from 'react';
import { TrendingUp, Award, Users, BarChart3 } from 'lucide-react';
import { StatCard } from '../Shared/StatCard';
import { apiService } from '../../services/api';

export default function ChainRankAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, topData] = await Promise.all([
        apiService.getChainRankStats(),
        apiService.getTopRankedAgents()
      ]);
      setStats(statsData);
      setTopAgents(topData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading ChainRank data:', error);
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ChainRank Analytics</h1>
        <p className="text-gray-600 mt-2">Reputation scoring and performance metrics</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="Network Avg" value={stats.networkAvg.toString()} icon={TrendingUp} color="blue" />
        <StatCard label="Top Performer" value={stats.topPerformer.toString()} icon={Award} color="green" />
        <StatCard label="Agents > 90" value={stats.agentsAbove90.toString()} icon={Users} color="purple" />
        <StatCard label="Total Scored" value={stats.totalScored.toString()} icon={BarChart3} color="orange" />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="font-bold text-lg mb-4">Top Ranked Agents</h3>
        <div className="space-y-3">
          {topAgents.map(agent => (
            <div key={agent.rank} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    agent.rank === 1 ? 'bg-yellow-500' : 
                    agent.rank === 2 ? 'bg-gray-400' : 
                    agent.rank === 3 ? 'bg-orange-400' : 'bg-blue-500'
                  }`}>
                    {agent.rank}
                  </div>
                  <div>
                    <div className="font-bold">{agent.name}</div>
                    <div className="text-sm text-gray-500">ChainRank: {agent.chainrank}</div>
                  </div>
                </div>
                <div className="flex gap-8 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Consistency</div>
                    <div className="font-bold">{agent.consistency}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Density</div>
                    <div className="font-bold">{agent.density}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">Outcome</div>
                    <div className="font-bold">{agent.outcome}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
