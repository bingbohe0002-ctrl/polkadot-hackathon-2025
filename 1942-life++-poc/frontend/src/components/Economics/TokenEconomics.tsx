import { useState, useEffect } from 'react';
import { TrendingUp, Lock, Award, BarChart3 } from 'lucide-react';
import { StatCard } from '../Shared/StatCard';
import { apiService } from '../../services/api';

export default function TokenEconomics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const economics = await apiService.getTokenEconomics();
      setData(economics);
      setLoading(false);
    } catch (error) {
      console.error('Error loading token economics:', error);
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Token Economics</h1>
        <p className="text-gray-600 mt-2">CATK & aNFT marketplace dynamics</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="CATK Price" value={data.catkPrice} icon={TrendingUp} color="blue" change="+5.2%" />
        <StatCard label="Total Staked" value={data.totalStaked} icon={Lock} color="purple" percentage="12.5%" />
        <StatCard label="aNFTs Minted" value={data.anftsMinted} icon={Award} color="green" />
        <StatCard label="24h Volume" value={data.volume24h} icon={BarChart3} color="orange" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-4">Token Metrics</h3>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Supply</span>
            <span className="font-bold">{data.metrics.totalSupply}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Circulating</span>
            <span className="font-bold">{data.metrics.circulating}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Staked</span>
            <span className="font-bold text-purple-600">{data.metrics.staked}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Burned</span>
            <span className="font-bold text-red-600">{data.metrics.burned}</span>
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Market Cap</span>
              <span className="font-bold">{data.metrics.marketCap}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
