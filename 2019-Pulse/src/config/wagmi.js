import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polkadotHubTestnet } from './chains';

export const config = getDefaultConfig({
  appName: 'Pulse Chat',
  projectId: '11fb17701427fe0f5dbc13487c966900',
  chains: [polkadotHubTestnet],
  ssr: false,
});

