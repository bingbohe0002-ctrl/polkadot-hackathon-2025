'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { wagmiConfig, chains } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            cacheTime: 10 * 60 * 1000, // 10 minutes
            retry: 3,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            chains={chains}
            theme={{
              lightMode: lightTheme({
                accentColor: '#3B82F6',
                accentColorForeground: 'white',
                borderRadius: 'medium',
                fontStack: 'system',
                overlayBlur: 'small',
              }),
              darkMode: darkTheme({
                accentColor: '#3B82F6',
                accentColorForeground: 'white',
                borderRadius: 'medium',
                fontStack: 'system',
                overlayBlur: 'small',
              }),
            }}
            appInfo={{
              appName: 'PEX - PolkaVM Perpetual DEX',
              learnMoreUrl: 'https://docs.pex.finance',
            }}
            modalSize="compact"
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </ThemeProvider>
  );
}