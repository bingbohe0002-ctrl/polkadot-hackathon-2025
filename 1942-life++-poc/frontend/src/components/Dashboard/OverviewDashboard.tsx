/**
 * Overview Dashboard Component
 * 
 * The main dashboard providing a comprehensive overview of the Life++ system.
 * Displays key metrics, system health, proof submission volume, recent activity,
 * and top-performing agents. Auto-refreshes every 30 seconds to keep data current.
 * 
 * @module OverviewDashboard
 * @description Real-time system monitoring and analytics dashboard
 */

import { useState, useEffect, useMemo } from 'react';
import { FileText, Users, Activity, Clock } from 'lucide-react';
import { StatCard } from '../Shared/StatCard';
import { HealthItem } from '../Shared/HealthItem';
import { apiService, DashboardStats } from '../../services/api';

/**
 * Overview Dashboard Component
 * 
 * Features:
 * - Key metrics cards (total proofs today, active agents, validators, verification time)
 * - 24-hour proof submission volume chart
 * - System health indicators (blockchain, IPFS, validators, API)
 * - Recent activity feed (sorted by time, newest first)
 * - Top performing agents list
 * - Auto-refresh every 30 seconds
 * - Data source indicators (real vs mock data)
 */
export default function OverviewDashboard() {
  // State: Dashboard statistics data from backend
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // State: Loading indicator for initial data load
  const [loading, setLoading] = useState(true);
  
  // State: Independent loading indicator for Recent Activity
  const [activityLoading, setActivityLoading] = useState(true);

  /**
   * Effect: Load stats on mount and set up auto-refresh
   * 
   * Loads dashboard statistics immediately when component mounts,
   * then sets up an interval to refresh data every 30 seconds to keep metrics current.
   * Cleans up the interval on component unmount.
   */
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []); // Only run on mount

  // Recent Activity must use mock data only → no extra fetch

  /**
   * Load Dashboard Statistics (Quick)
   * 
   * Fetches instant mock dashboard statistics for fast initial page load.
   * After the quick load, separately loads Real Activity feed asynchronously.
   * 
   * @async
   */
  async function loadStats() {
    try {
      // First, get quick mock data for instant UI rendering
      const quickData = await apiService.getDashboardStatsQuick();
      const hasActivity = Array.isArray(quickData.recentActivity) && quickData.recentActivity.length > 0;
      const ensured = hasActivity ? quickData : {
        ...quickData,
        recentActivity: generateMockRecentActivity(),
      } as DashboardStats;
      setStats(ensured);
      setLoading(false);
      
      // Recent Activity must use mock data only; quick/ensured data already contains it
      setActivityLoading(false);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setLoading(false);
    }
  }

  function generateMockRecentActivity() {
    const now = Date.now();
    const items = [
      { offsetMin: 2,  msg: 'Proof 0xabc12345... verified' },
      { offsetMin: 8,  msg: 'Agent robot-arm-001 submitted a proof' },
      { offsetMin: 25, msg: 'Proof 0xdef67890... verified' },
      { offsetMin: 55, msg: 'Agent delivery-bot-015 submitted a proof' },
      { offsetMin: 120, msg: 'Proof 0x9988aa77... verified' },
    ];
    return items.map(i => {
      const ts = now - i.offsetMin * 60000;
      const mins = i.offsetMin;
      const time = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
      return {
        type: 'proof',
        msg: i.msg,
        time,
        timestamp: ts,
        isReal: false,
      } as any;
    });
  }

  /**
   * Load Recent Activity (Real Data)
   * 
   * Fetches only the Recent Activity feed and Top Agents from blockchain.
   * This is queried separately to avoid blocking the initial page load.
   * 
   * @async
   */
  async function loadActivity() {
    try {
      setActivityLoading(true);
      
      // No time parameters: backend will返回“最近 N 条”逻辑
      const activityData = await apiService.getDashboardActivity();
      
      // Merge activity data into existing stats
      if (stats) {
        setStats({
          ...stats,
          recentActivity: activityData.recentActivity,
          topAgents: activityData.topAgents
        });
      }
      
      setActivityLoading(false);
    } catch (error) {
      console.error('Error loading dashboard activity:', error);
      setActivityLoading(false);
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
   * - "329h ago" -> 329 hours ago
   * - "13d ago" -> 13 days ago
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
   * Sorted Recent Activity (Memoized)
   * 
   * Returns recent activity sorted by time in descending order (newest first).
   * Uses useMemo to avoid re-sorting on every render when activity data hasn't changed.
   * 
   * @returns Array of recent activities sorted by timestamp (newest to oldest)
   */
  const sortedRecentActivity = useMemo(() => {
    if (!stats?.recentActivity) return [];
    return [...stats.recentActivity].sort((a, b) => {
      const timeA = parseTimeToTimestamp(a.time);
      const timeB = parseTimeToTimestamp(b.time);
      return timeB - timeA; // Descending order: newest first
    });
  }, [stats?.recentActivity]);

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Life++ Overview Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time system monitoring and analytics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard 
          label="Total Proofs Today" 
          value={stats.totalProofsToday.toLocaleString()} 
          change="+12.5%" 
          icon={FileText} 
          color="blue" 
        />
        <StatCard 
          label="Active Agents" 
          value={stats.activeAgents.toLocaleString()} 
          change="+5.2%" 
          icon={Users} 
          color="green" 
        />
        <StatCard 
          label="Validators Online" 
          value={stats.validatorsOnline} 
          change="100%" 
          icon={Activity} 
          color="purple" 
        />
        <StatCard 
          label="Avg Verification Time" 
          value={stats.avgVerificationTime} 
          change="-0.5s" 
          icon={Clock} 
          color="orange" 
        />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Proof Submission Volume (24h)</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.proofVolume24h && stats.proofVolume24h.length > 0 ? (
              stats.proofVolume24h.map((h: any, i: number) => {
                // Handle both object format {hour, volume} and number format
                const volume = typeof h === 'object' && h.volume !== undefined ? h.volume : h;
                return (
                  <div 
                    key={i} 
                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors" 
                    style={{height: `${volume}%`}} 
                    title={`${typeof h === 'object' && h.hour ? h.hour : `${i}:00`}: ${volume}`}
                  />
                );
              })
            ) : (
              <div className="text-center text-gray-500 w-full">No data available</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">System Health</h3>
          <div className="space-y-4">
            <HealthItem label="Blockchain Node" status="Healthy" percentage={stats.systemHealth.blockchain} />
            <HealthItem label="IPFS Storage" status="Healthy" percentage={stats.systemHealth.ipfs} />
            <HealthItem label="Validator Network" status="Healthy" percentage={stats.systemHealth.validatorNetwork} />
            <HealthItem label="API Services" status="Healthy" percentage={stats.systemHealth.apiServices} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Recent Activity</h3>
            {activityLoading ? (
              <span className="text-xs text-gray-500">Loading...</span>
            ) : stats.dataSource && stats.dataSource.proofs === 'real' && sortedRecentActivity.length > 0 && (
              <span className="text-xs text-blue-600 font-medium">实时数据</span>
            )}
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activityLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2">Loading recent activity...</p>
              </div>
            ) : sortedRecentActivity.length > 0 ? (
              sortedRecentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'proof' ? 'bg-blue-500' :
                    activity.type === 'agent' ? 'bg-green-500' :
                    activity.type === 'regulatory' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.msg}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                  {activity.isReal && (
                    <span className="text-xs text-green-600 font-medium" title="真实数据">✓</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No recent activity</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Top Performing Agents</h3>
          <div className="space-y-3">
            {stats.topAgents.length > 0 ? (
              stats.topAgents.map((agent, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{agent.name}</div>
                      <div className="text-xs text-gray-500">{agent.proofs} proofs</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">{agent.chainrank}</div>
                    <div className="text-xs text-gray-500">ChainRank</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No agent data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
