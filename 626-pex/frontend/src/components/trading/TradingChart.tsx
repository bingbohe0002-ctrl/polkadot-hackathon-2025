'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useOraclePrice } from '@/hooks/contracts/useOracleAdapter';
import { useSpotPrice } from '@/hooks/useSpotPrice';

interface TradingChartProps {
  market: string;
}

export function TradingChart({ market }: TradingChartProps) {
  // 采用实时现货价格作为主显示，链上指数价作为回退
  const { price: spotPrice } = useSpotPrice(market, { pollingIntervalMs: 2000 });
  const { price: oraclePrice } = useOraclePrice(market);
  const headerPrice = spotPrice ?? oraclePrice ?? null;

  const containerId = 'tv_chart_container';
  const tvScriptLoadingRef = useRef<boolean>(false);
  const advancedInjectedRef = useRef<boolean>(false);

  const tvSymbol = useMemo(() => {
    // Map internal market symbol to TradingView symbol
    switch (market) {
      case 'BTC-USD':
        return 'COINBASE:BTCUSD';
      case 'ETH-USD':
        return 'COINBASE:ETHUSD';
      default:
        return 'COINBASE:BTCUSD';
    }
  }, [market]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Cleanup previous content when market changes
    container.innerHTML = '';
    advancedInjectedRef.current = false;

    function initWidget() {
      if (!(window as any).TradingView) return;
      // @ts-ignore
      const TV = (window as any).TradingView;
      try {
        new TV.widget({
          symbol: tvSymbol,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'zh',
          hide_side_toolbar: false,
          allow_symbol_change: true,
          withdateranges: true,
          autosize: true,
          container_id: containerId,
        });
      } catch (_) {
        injectAdvancedEmbed();
      }
    }

    function injectAdvancedEmbed() {
      if (advancedInjectedRef.current) return;
      advancedInjectedRef.current = true;

      const wrap = document.createElement('div');
      wrap.className = 'tradingview-widget-container';
      const inner = document.createElement('div');
      inner.className = 'tradingview-widget-container__widget';
      wrap.appendChild(inner);

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: tvSymbol,
        interval: '15',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'zh',
        hide_side_toolbar: false,
        allow_symbol_change: true,
        withdateranges: true,
      });

      wrap.appendChild(script);
      container.appendChild(wrap);
    }

    // Load tv.js if not present, otherwise init
    if (!(window as any).TradingView && !tvScriptLoadingRef.current) {
      tvScriptLoadingRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        tvScriptLoadingRef.current = false;
        initWidget();
      };
      script.onerror = () => {
        tvScriptLoadingRef.current = false;
        injectAdvancedEmbed();
      };
      document.body.appendChild(script);

      // Fallback if tv.js is blocked by browser/extension
      setTimeout(() => {
        if (!(window as any).TradingView) {
          injectAdvancedEmbed();
        }
      }, 3000);
    } else {
      initWidget();
    }

    return () => {
      // Best-effort cleanup
      try {
        const c = document.getElementById(containerId);
        if (c) c.innerHTML = '';
      } catch {}
    };
  }, [tvSymbol]);

  return (
    <div className="h-full flex flex-col">
      {/* Chart Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">{market}</h3>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-500">{headerPrice != null ? `$${headerPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-xs bg-muted rounded hover:bg-muted/80">1m</button>
            <button className="px-3 py-1 text-xs bg-muted rounded hover:bg-muted/80">5m</button>
            <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">15m</button>
            <button className="px-3 py-1 text-xs bg-muted rounded hover:bg-muted/80">1h</button>
            <button className="px-3 py-1 text-xs bg-muted rounded hover:bg-muted/80">4h</button>
            <button className="px-3 py-1 text-xs bg-muted rounded hover:bg-muted/80">1d</button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 p-4">
        <div id={containerId} className="w-full h-full min-h-[360px] bg-muted/20 rounded-lg" />
      </div>
    </div>
  );
}