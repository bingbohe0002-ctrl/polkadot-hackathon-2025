interface SettingItemProps {
  label: string;
  value: string;
  unit: string;
  editable?: boolean;
}

function SettingItem({ label, value, unit, editable }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {editable ? (
          <input 
            type="number" 
            defaultValue={value}
            className="w-24 px-2 py-1 text-sm border rounded"
          />
        ) : (
          <span className="font-bold text-gray-900">{value}</span>
        )}
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

export default function SystemSettings() {
  return (
    <div className="p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Configure system parameters and policies</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Network Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">RPC Endpoint</label>
              <input 
                type="text" 
                defaultValue="https://testnet-passet-hub-eth-rpc.polkadot.io"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IPFS Gateway</label>
              <input 
                type="text" 
                defaultValue="https://ipfs.io/ipfs/"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chain ID</label>
              <input 
                type="text" 
                defaultValue="420420422"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Verification Parameters</h3>
          <div className="space-y-4">
            <SettingItem label="Required Attestations" value="3" unit="of 5" />
            <SettingItem label="Submission Time Window" value="120" unit="seconds" />
            <SettingItem label="Review Deadline" value="7" unit="days" />
            <SettingItem label="Auto-Approval Threshold" value="95" unit="%" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Regulatory Thresholds</h3>
          <div className="space-y-4">
            <SettingItem label="Value Escalation Threshold" value="10,000" unit="USDC" editable />
            <SettingItem label="Velocity Threshold (24h)" value="100" unit="proofs" editable />
            <SettingItem label="Good Faith Operating Period" value="90" unit="days" editable />
            <SettingItem label="Minimum ChainRank" value="60" unit="score" editable />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Require Hardware Signing</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable Multi-Factor Auth</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">KYC Required</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AML Screening</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-8 flex justify-end gap-3">
        <button className="px-6 py-2 border rounded-lg hover:bg-gray-50">
          Reset to Defaults
        </button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );
}
