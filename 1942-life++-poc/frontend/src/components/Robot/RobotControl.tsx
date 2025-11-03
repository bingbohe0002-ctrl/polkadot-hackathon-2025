import { useState } from 'react';
import { Zap, Activity, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '../Shared/StatCard';
import { StatusBadge } from '../Shared/StatusBadge';

export default function RobotControl() {
  const [selectedRobot, setSelectedRobot] = useState('robot-arm-001');

  const robots = [
    { id: 'robot-arm-001', status: 'active', battery: 85 },
    { id: 'delivery-bot-015', status: 'active', battery: 92 },
    { id: 'warehouse-ai-007', status: 'idle', battery: 76 }
  ];

  const proofs = [
    { id: '0x4d5e', task: 'Move cargo to B3', status: 'verified' as const, time: '2m ago' },
    { id: '0x6f7g', task: 'Quality inspection', status: 'verified' as const, time: '8m ago' },
    { id: '0x8h9i', task: 'Load balancing check', status: 'pending' as const, time: '15m ago' }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Robot Control Center</h1>
        <p className="text-gray-600 mt-2">Monitor and control connected robots</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="Connected Robots" value="12" icon={Zap} color="blue" />
        <StatCard label="Active Tasks" value="8" icon={Activity} color="green" />
        <StatCard label="Success Rate" value="98.5%" icon={CheckCircle} color="purple" />
        <StatCard label="Avg Response" value="1.2s" icon={Clock} color="orange" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Connected Robots</h3>
          <div className="space-y-2">
            {robots.map(robot => (
              <button
                key={robot.id}
                onClick={() => setSelectedRobot(robot.id)}
                className={`w-full p-3 rounded text-left transition-colors ${
                  selectedRobot === robot.id ? 'bg-blue-50 border-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{robot.id}</span>
                  <div className={`w-2 h-2 rounded-full ${robot.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Battery: {robot.battery}%</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${robot.battery > 80 ? 'bg-green-500' : robot.battery > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{width: `${robot.battery}%`}}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">{selectedRobot}</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                Start Task
              </button>
              <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                Emergency Stop
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-sm mb-3">Real-time Telemetry</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-mono">X:150 Y:250 Z:100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temperature:</span>
                  <span className="font-mono">23.5°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Velocity:</span>
                  <span className="font-mono">0.5 m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Load:</span>
                  <span className="font-mono">12.5 kg</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">Current Task</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Task:</span>
                  <span className="font-medium">Move to B3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ETA:</span>
                  <span className="font-medium">30 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proof Status:</span>
                  <span className="text-green-600 font-medium">Submitting...</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Recent Cognitive Proofs</h4>
            <div className="space-y-2">
              {proofs.map(proof => (
                <div key={proof.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <code className="text-xs">{proof.id}</code>
                  <span className="text-gray-600">{proof.task}</span>
                  <StatusBadge status={proof.status} />
                  <span className="text-xs text-gray-500">{proof.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
