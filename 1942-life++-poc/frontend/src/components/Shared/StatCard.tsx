/**
 * StatCard Component
 * 
 * A reusable card component for displaying key metrics and statistics.
 * Used throughout the dashboard and other modules to show numerical values
 * with icons, labels, and optional change indicators.
 * 
 * @module StatCard
 * @description Reusable statistics card component with icon and optional change indicator
 */

import { LucideIcon } from 'lucide-react';

/**
 * StatCard Component Props Interface
 */
interface StatCardProps {
  /** Display label for the statistic (e.g., "Total Proofs Today") */
  label: string;
  /** Main value to display (e.g., "1,247", "3/5") */
  value: string;
  /** Optional change indicator (e.g., "+12.5%", "-0.5s"). Color-coded: green for positive, red for negative */
  change?: string;
  /** Lucide React icon component to display */
  icon: LucideIcon;
  /** Color theme for the icon gradient background */
  color: 'blue' | 'green' | 'purple' | 'orange' | 'yellow' | 'red';
  /** Optional percentage to display instead of change (e.g., "95.8%") */
  percentage?: string;
}

/**
 * StatCard Component
 * 
 * Displays a metric card with:
 * - Icon with gradient background (color-coded)
 * - Large value display
 * - Label text
 * - Optional change/percentage indicator (color-coded: green for positive, red for negative)
 * 
 * @param props - StatCard component props
 * @returns JSX element representing a statistics card
 */
export function StatCard({ label, value, change, icon: Icon, color, percentage }: StatCardProps) {
  /**
   * Color mapping for gradient backgrounds
   * Maps color names to Tailwind CSS gradient classes
   */
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header: Icon and change indicator */}
      <div className="flex items-center justify-between mb-3">
        {/* Icon with gradient background */}
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        {/* Change or percentage indicator (if provided) */}
        {(change || percentage) && (
          <span className={`text-xs font-medium ${
            // Color-code based on change direction: green for positive, red for negative, blue for neutral
            change?.startsWith('+') ? 'text-green-600' : 
            change?.startsWith('-') ? 'text-red-600' : 'text-blue-600'
          }`}>
            {change || percentage}
          </span>
        )}
      </div>
      {/* Main value display */}
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {/* Label text */}
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}
