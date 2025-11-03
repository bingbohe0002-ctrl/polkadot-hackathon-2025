/**
 * StatusBadge Component
 * 
 * A reusable badge component for displaying status indicators with color-coding.
 * Used throughout the application to show proof verification status, agent status, etc.
 * 
 * @module StatusBadge
 * @description Reusable status badge component with color-coded status indicators
 */

/**
 * StatusBadge Component Props Interface
 */
interface StatusBadgeProps {
  /** Status value to display. Determines the badge color and text. */
  status: 'verified' | 'pending' | 'rejected' | 'active';
}

/**
 * StatusBadge Component
 * 
 * Displays a color-coded status badge with uppercase text.
 * Color mapping:
 * - verified: Green background (success state)
 * - pending: Yellow background (warning/awaiting action)
 * - rejected: Red background (error/failed state)
 * - active: Blue background (informational/active state)
 * 
 * @param props - StatusBadge component props
 * @returns JSX element representing a status badge
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  /**
   * Status style mapping
   * Maps each status to Tailwind CSS classes for background and text colors
   */
  const styles = {
    verified: 'bg-green-100 text-green-800',    // Green: verified/success
    pending: 'bg-yellow-100 text-yellow-800',   // Yellow: pending/warning
    rejected: 'bg-red-100 text-red-800',        // Red: rejected/error
    active: 'bg-blue-100 text-blue-800'         // Blue: active/informational
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.toUpperCase()}
    </span>
  );
}
