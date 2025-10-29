import express from 'express';
import axios from 'axios';

const router = express.Router();

// 币安 API 配置
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
const BINANCE_FAPI_URL = 'https://fapi.binance.com/fapi/v1';

// 符号映射（币安交易对格式）
const SYMBOL_MAP = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'DOT': 'DOTUSDT',
  'SOL': 'SOLUSDT',
  'ADA': 'ADAUSDT',
  'MATIC': 'MATICUSDT',
  'LINK': 'LINKUSDT',
  'AVAX': 'AVAXUSDT'
};

/**
 * 获取当前价格（币安 API）
 */
async function fetchCurrentPrice(symbol) {
  try {
    const tradingPair = SYMBOL_MAP[symbol.toUpperCase()] || `${symbol.toUpperCase()}USDT`;
    
    // 获取24小时价格变动统计
    const ticker24h = await axios.get(`${BINANCE_BASE_URL}/ticker/24hr`, {
      params: { symbol: tradingPair }
    });

    const data = ticker24h.data;
    
    return {
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.quoteVolume), // USDT 计价的成交量
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      trades24h: data.count
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * 获取历史数据（币安 K线数据）
 */
async function fetchHistoricalData(symbol, days = 7) {
  try {
    const tradingPair = SYMBOL_MAP[symbol.toUpperCase()] || `${symbol.toUpperCase()}USDT`;
    
    // 根据天数确定时间间隔
    const interval = days <= 1 ? '1h' : (days <= 7 ? '4h' : '1d');
    
    // 计算开始时间
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);
    
    // 获取 K线数据
    const response = await axios.get(`${BINANCE_BASE_URL}/klines`, {
      params: {
        symbol: tradingPair,
        interval: interval,
        startTime: startTime,
        endTime: endTime,
        limit: 1000
      }
    });

    // 转换数据格式为与 CoinGecko 兼容的格式
    const prices = [];
    const volumes = [];
    const ohlcv = [];
    
    response.data.forEach(kline => {
      const [
        openTime,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        quoteVolume
      ] = kline;
      
      prices.push([openTime, parseFloat(close)]);
      volumes.push([openTime, parseFloat(quoteVolume)]);
      
      ohlcv.push({
        timestamp: openTime,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseFloat(volume),
        quoteVolume: parseFloat(quoteVolume)
      });
    });

    return {
      prices: prices,
      volumes: volumes,
      ohlcv: ohlcv // 额外提供完整的 OHLCV 数据
    };
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * 调用 Python Kronos 模型进行预测
 */
async function callKronosPredictor(symbol, historicalData, days = 7) {
  try {
    // 调用本地 Python Flask 服务
    const response = await axios.post('http://localhost:5001/predict', {
      symbol: symbol,
      data: historicalData,
      days: days
    }, {
      timeout: 30000 // 30秒超时
    });

    return response.data;
  } catch (error) {
    console.error('Kronos predictor error:', error.message);
    
    // 如果 Python 服务不可用，使用简单的预测算法作为后备
    return generateSimplePrediction(historicalData, days);
  }
}

/**
 * 简单预测算法（后备方案）
 */
function generateSimplePrediction(historicalData, days = 7) {
  if (!historicalData || !historicalData.prices || historicalData.prices.length === 0) {
    return null;
  }

  const prices = historicalData.prices.map(p => p[1]);
  const volumes = (historicalData.volumes || []).map(v => v[1]);
  const latestPrice = prices[prices.length - 1];
  const latestVolume = volumes.length ? volumes[volumes.length - 1] : 0;
  
  // 计算移动平均
  const ma7 = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const vma7 = volumes.length ? (volumes.slice(-7).reduce((a,b)=>a+b,0) / Math.max(1, Math.min(7, volumes.length))) : 0;
  
  // 计算趋势
  const trend = (latestPrice - ma7) / ma7;
  const vtrend = vma7 ? (latestVolume - vma7) / vma7 : 0;
  
  // 生成预测（按天）
  const randomFactor = (Math.random() - 0.5) * 0.1; // ±10% 随机因素
  const predictionFuture = latestPrice * (1 + trend + randomFactor);
  
  // 生成未来 N 天的预测点（价格与成交量）
  const predictions = [];
  const volumePredictions = [];
  for (let i = 1; i <= days; i++) {
    const dailyRandom = (Math.random() - 0.5) * 0.04;
    const volRandom = (Math.random() - 0.5) * 0.15;
    predictions.push({
      day: i,
      price: latestPrice * (1 + trend * (i / Math.max(1, days)) + dailyRandom),
      timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
    });
    volumePredictions.push({
      day: i,
      volume: Math.max(0, latestVolume * (1 + vtrend * (i / Math.max(1, days)) + volRandom)),
      timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return {
    price_24h: predictionFuture,
    confidence: 0.65,
    trend: trend > 0 ? 'bullish' : 'bearish',
    predictions: predictions,
    volumePredictions: volumePredictions,
    model: 'simple_fallback'
  };
}

/**
 * GET /api/predict
 * 获取价格预测
 */
router.get('/predict', async (req, res) => {
  try {
    const symbol = (req.query.symbol || 'BTC').toUpperCase();
    const days = parseInt(req.query.days) || 7;
    
    // 获取当前价格
    const currentPriceData = await fetchCurrentPrice(symbol);
    
    // 获取历史数据（指定天数）
    const historicalData = await fetchHistoricalData(symbol, days);
    
    // 调用 Kronos 模型预测
    const prediction = await callKronosPredictor(symbol, historicalData, days);

    res.json({
      symbol: symbol,
      currentPrice: currentPriceData.price,
      change24h: currentPriceData.change24h,
      volume24h: currentPriceData.volume24h,
      high24h: currentPriceData.high24h,
      low24h: currentPriceData.low24h,
      trades24h: currentPriceData.trades24h,
      prediction: prediction,
      timestamp: new Date().toISOString(),
      dataSource: 'Binance'
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      error: 'Prediction failed',
      message: error.message
    });
  }
});

/**
 * GET /api/history
 * 获取历史数据
 */
router.get('/history', async (req, res) => {
  try {
    const symbol = (req.query.symbol || 'BTC').toUpperCase();
    const days = parseInt(req.query.days) || 7;

    const historicalData = await fetchHistoricalData(symbol, days);

    res.json({
      symbol: symbol,
      days: days,
      data: historicalData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

/**
 * GET /api/assets
 * 获取支持的资产列表
 */
router.get('/assets', (req, res) => {
  const assets = Object.keys(SYMBOL_MAP).map(symbol => ({
    symbol: symbol,
    name: SYMBOL_MAP[symbol],
    supported: true
  }));

  res.json({
    assets: assets,
    count: assets.length
  });
});

export default router;

