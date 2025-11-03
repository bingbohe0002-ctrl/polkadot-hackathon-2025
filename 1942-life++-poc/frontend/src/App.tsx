/**
 * Life++ PoC Frontend - Main Application Component
 * 
 * This is the root component that manages the overall application layout,
 * navigation, and role-based access control (RBAC). It provides a sidebar
 * navigation system with multiple functional modules for managing cognitive
 * proofs, AI agents, validators, compliance, and token economics.
 * 
 * @module App
 * @description Main application container with sidebar navigation and module routing
 */

import { useState } from 'react';
import { 
  Shield, Activity, FileText, Users, Settings, TrendingUp, 
  BarChart3, Zap, Lock, Menu, X, Home
} from 'lucide-react';
import OverviewDashboard from './components/Dashboard/OverviewDashboard';
import RegulatoryOversight from './components/Regulatory/RegulatoryOversight';
import ProofExplorer from './components/Proofs/ProofExplorer';
import AgentRegistry from './components/Agents/AgentRegistry';
import ValidatorNetwork from './components/Validators/ValidatorNetwork';
import ChainRankAnalytics from './components/ChainRank/ChainRankAnalytics';
import ComplianceCenter from './components/Compliance/ComplianceCenter';
import TokenEconomics from './components/Economics/TokenEconomics';
import RobotControl from './components/Robot/RobotControl';
import SystemSettings from './components/Settings/SystemSettings';

/**
 * Main Application Component
 * 
 * Manages the application state including:
 * - Active module selection (dashboard, proofs, agents, etc.)
 * - Sidebar visibility (collapsed/expanded)
 * - User role for RBAC (regulator, developer, operator)
 * 
 * Features:
 * - Role-based module filtering (only show modules accessible to current role)
 * - Collapsible sidebar for better UX on smaller screens
 * - Conditional rendering of modules based on active selection
 */
export default function App() {
  // State: Currently active module identifier (defaults to dashboard)
  const [activeModule, setActiveModule] = useState('dashboard');
  
  // State: Sidebar visibility (true = expanded, false = collapsed to icon-only mode)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // State: Current user role for role-based access control
  // Determines which modules are visible and accessible
  const [userRole, setUserRole] = useState<'regulator' | 'developer' | 'operator'>('regulator');

  /**
   * Application Modules Configuration
   * 
   * Defines all available modules with their properties:
   * - id: Unique identifier for routing
   * - name: Display name in sidebar
   * - icon: Lucide React icon component
   * - roles: Array of roles that can access this module ('all' = accessible to everyone)
   */
  const modules = [
    { id: 'dashboard', name: 'Overview Dashboard', icon: Home, roles: ['all'] },
    { id: 'regulatory', name: 'Regulatory Oversight', icon: Shield, roles: ['regulator'] },
    { id: 'proofs', name: 'Proof Explorer', icon: FileText, roles: ['all'] },
    { id: 'agents', name: 'Agent Registry', icon: Users, roles: ['all'] },
    { id: 'validators', name: 'Validator Network', icon: Activity, roles: ['developer', 'operator'] },
    { id: 'chainrank', name: 'ChainRank Analytics', icon: TrendingUp, roles: ['all'] },
    { id: 'compliance', name: 'Compliance Center', icon: Lock, roles: ['regulator', 'operator'] },
    { id: 'economics', name: 'Token Economics', icon: BarChart3, roles: ['all'] },
    { id: 'robot', name: 'Robot Control', icon: Zap, roles: ['operator'] },
    { id: 'settings', name: 'System Settings', icon: Settings, roles: ['regulator', 'developer'] }
  ];

  /**
   * Filtered Modules Based on User Role
   * 
   * Filters the modules array to show only modules accessible to the current user role.
   * A module is accessible if:
   * - It includes 'all' in its roles array, OR
   * - It includes the current userRole in its roles array
   */
  const filteredModules = modules.filter(m => 
    m.roles.includes('all') || m.roles.includes(userRole)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 
        Sidebar Navigation Panel
        - Collapsible sidebar with gradient background (blue-900 to blue-800)
        - Width adapts based on sidebarOpen state (64 = expanded, 20 = collapsed)
        - Smooth transition animation on width change
      */}
      <aside className={`bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Sidebar Header: Logo and Toggle Button */}
        <div className="p-4 flex items-center justify-between">
          {/* Logo only shows when sidebar is expanded */}
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-300" />
              <span className="font-bold text-xl">Life++</span>
            </div>
          )}
          {/* Toggle button: X icon when expanded, Menu icon when collapsed */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-blue-300 hover:text-white"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation Menu: List of accessible modules */}
        <nav className="mt-8">
          {filteredModules.map(module => {
            const Icon = module.icon; // Extract icon component for rendering
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                  // Highlight active module with blue background and left border
                  activeModule === module.id 
                    ? 'bg-blue-700 border-l-4 border-blue-400' 
                    : 'hover:bg-blue-700/50'
                }`}
                aria-label={`Navigate to ${module.name}`}
              >
                <Icon className="w-5 h-5" />
                {/* Module name only shows when sidebar is expanded */}
                {sidebarOpen && <span className="text-sm font-medium">{module.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Role Selector: Only visible when sidebar is expanded */}
        {sidebarOpen && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-blue-700/50 rounded-lg p-3">
              {/* User Info Badge */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">MAS</span>
                </div>
                <div>
                  <div className="text-xs font-medium">MAS Officer</div>
                  <div className="text-xs text-blue-300">Authorized</div>
                </div>
              </div>
              {/* Role Selection Dropdown
                  Allows switching between different user roles for testing/demo purposes.
                  In production, this would be determined by authentication/authorization.
              */}
              <select 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value as 'regulator' | 'developer' | 'operator')}
                className="w-full mt-2 px-2 py-1 text-xs bg-blue-800 rounded text-white"
                aria-label="Select user role"
              >
                <option value="regulator">Regulator View</option>
                <option value="developer">Developer View</option>
                <option value="operator">Operator View</option>
              </select>
            </div>
          </div>
        )}
      </aside>

      {/* 
        Main Content Area
        - Takes remaining flex space (flex-1)
        - Scrollable content area (overflow-y-auto)
        - Conditionally renders the active module component based on activeModule state
      */}
      <main className="flex-1 overflow-y-auto">
        {activeModule === 'dashboard' && <OverviewDashboard />}
        {activeModule === 'regulatory' && <RegulatoryOversight />}
        {activeModule === 'proofs' && <ProofExplorer />}
        {activeModule === 'agents' && <AgentRegistry />}
        {activeModule === 'validators' && <ValidatorNetwork />}
        {activeModule === 'chainrank' && <ChainRankAnalytics />}
        {activeModule === 'compliance' && <ComplianceCenter />}
        {activeModule === 'economics' && <TokenEconomics />}
        {activeModule === 'robot' && <RobotControl />}
        {activeModule === 'settings' && <SystemSettings />}
      </main>
    </div>
  );
}
