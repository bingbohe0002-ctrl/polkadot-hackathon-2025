/**
 * HealthItem Component
 * 
 * A reusable component for displaying system health metrics with progress bars.
 * Used in the dashboard to show health status of various system components
 * (blockchain, IPFS, validators, API services).
 * 
 * @module HealthItem
 * @description Reusable health status component with progress bar indicator
 */

/**
 * HealthItem Component Props Interface
 */
interface HealthItemProps {
  /** Label for the health metric (e.g., "Blockchain Node", "IPFS Storage") */
  label: string;
  /** Status text to display (e.g., "Healthy", "Degraded") */
  status: string;
  /** Health percentage (0-100) to display in the progress bar */
  percentage: number;
}

/**
 * HealthItem Component
 * 
 * Displays a health metric with:
 * - Label and status text
 * - Visual progress bar showing health percentage
 * - Green color scheme for healthy systems
 * 
 * @param props - HealthItem component props
 * @returns JSX element representing a health status item
 */
export function HealthItem({ label, status, percentage }: HealthItemProps) {
  return (
    <div>
      {/* Header: Label and status text */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-green-600">{status}</span>
      </div>
      {/* Progress bar: Visual representation of health percentage */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
