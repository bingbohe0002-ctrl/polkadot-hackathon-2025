import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Send,
  Refresh,
} from '@mui/icons-material';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getPrediction, getHistory, submitPredictionToChain } from '../api/backend';

interface PredictionPanelProps {
  account: InjectedAccountWithMeta;
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

const SUPPORTED_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'DOT', name: 'Polkadot' },
];

const PredictionPanel = ({ account, showNotification }: PredictionPanelProps) => {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [userPrediction, setUserPrediction] = useState('');
  const [days, setDays] = useState<number>(7);
  const [tab, setTab] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    loadAll();
  }, [selectedAsset, days]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pred, hist] = await Promise.all([
        getPrediction(selectedAsset + '', days),
        getHistory(selectedAsset, days)
      ]);
      setPredictionData(pred);
      // 后端 history: { data: { prices, volumes, ohlcv } }
      setHistoryData((hist?.data?.ohlcv || []).map((d: any) => ({
        time: d.timestamp,
        close: d.close,
        volume: d.quoteVolume || d.volume || 0,
      })));
    } catch (error) {
      console.error('Failed to load data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPrediction = async () => {
    if (!userPrediction || parseFloat(userPrediction) <= 0) {
      showNotification('Please enter a valid prediction value', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const result: any = await submitPredictionToChain(
        account,
        selectedAsset,
        parseFloat(userPrediction)
      );

      if (result.success) {
        showNotification(
          `Prediction submitted successfully! Block: ${result.blockHash}`,
          'success'
        );
        setUserPrediction('');
      } else {
        showNotification(`Failed to submit: ${result.error}`, 'error');
      }
    } catch (error: any) {
      console.error('Failed to submit prediction:', error);
      showNotification(error.message || 'Failed to submit prediction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const preparePriceChartData = () => {
    // 第一部分：历史价格数据 - 按日期取最后一个收盘价
    const historicalMap = new Map<string, number>();
    (historyData || []).forEach((d: any) => {
      const dateStr = new Date(d.time).toLocaleDateString();
      historicalMap.set(dateStr, d.close); // 覆盖，保留最新的收盘价
    });
    
    const historicalData = Array.from(historicalMap.entries()).map(([time, price]) => ({
      time,
      price,
      predicted: null,
    }));

    // 第二部分：预测价格数据 - 直接使用后端返回的按天数据
    const predictions = predictionData?.prediction?.predictions || [];
    const predictedData = predictions.map((p: any) => {
      const predTime = new Date(p.timestamp);
      return {
        time: predTime.toLocaleDateString(),
        price: null,
        predicted: p.price || 0,
      };
    });

    // 合并：前半部分历史，后半部分预测
    return [...historicalData, ...predictedData];
  };

  const prepareVolumeData = () => {
    // 第一部分：历史数据 - 按日期聚合去重
    const historicalMap = new Map<string, number>();
    (historyData || []).forEach((d: any) => {
      const dateStr = new Date(d.time).toLocaleDateString();
      const currentVol = historicalMap.get(dateStr) || 0;
      historicalMap.set(dateStr, currentVol + (d.volume || 0));
    });
    
    const historicalData = Array.from(historicalMap.entries()).map(([time, volume]) => ({
      time,
      historicalVolume: volume,
      predictedVolume: null,
    }));
    
    // 第二部分：预测数据 - 直接使用后端返回的按天数据
    const predictions = predictionData?.prediction?.predictions || [];
    const predictedData = predictions.map((v: any) => {
      const predTime = new Date(v.timestamp);
      return {
        time: predTime.toLocaleDateString(),
        historicalVolume: null,
        predictedVolume: v.volume || 0,
      };
    });
    
    // 合并：前半部分历史，后半部分预测
    return [...historicalData, ...predictedData];
  };

  // 计算价格图表的Y轴范围，从最小价格附近开始
  const getPriceDomain = () => {
    const priceData = preparePriceChartData();
    const allPrices = [
      ...priceData.map((d: any) => d.price).filter(Boolean),
      ...priceData.map((d: any) => d.predicted).filter(Boolean),
    ];
    
    if (allPrices.length === 0) return undefined;
    
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1; // 10% padding
    
    return [minPrice - padding, maxPrice + padding];
  };

  // 计算交易量图表的Y轴范围，从最小交易量附近开始
  const getVolumeDomain = () => {
    const volumeData = prepareVolumeData();
    const allVolumes = [
      ...volumeData.map((d: any) => d.historicalVolume).filter(Boolean),
      ...volumeData.map((d: any) => d.predictedVolume).filter(Boolean),
    ];
    if (allVolumes.length === 0) return undefined;
    const minVolume = Math.min(...allVolumes);
    const maxVolume = Math.max(...allVolumes);
    const range = maxVolume - minVolume;
    const padding = range * 0.1; // 10% padding
    return [minVolume - padding, maxVolume + padding];
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 左侧边栏 */}
        <Grid item xs={12} md={3}>
          {/* 搜索与列表 */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Cryptocurrency Search
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter token symbol or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 1 }}
            />
            <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
              {SUPPORTED_ASSETS.filter(a =>
                a.symbol.toLowerCase().includes(search.toLowerCase()) ||
                a.name.toLowerCase().includes(search.toLowerCase())
              ).map(asset => (
                <ListItemButton
                  key={asset.symbol}
                  selected={selectedAsset === asset.symbol}
                  onClick={() => setSelectedAsset(asset.symbol)}
                >
                  <ListItemText
                    primary={asset.symbol}
                    secondary={asset.name}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>

          {/* 已选择 Token 与价格 */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Selected Token
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{selectedAsset}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset)?.name}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {predictionData ? formatPrice(predictionData.currentPrice) : '-'}
                </Typography>
                <Chip
                  label={predictionData ? formatChange(predictionData.change24h) : '0%'}
                  size="small"
                  color={predictionData?.change24h >= 0 ? 'success' : 'error'}
                  sx={{ mt: 1 }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                  sx={{ mt: 2 }}
                  onClick={loadAll}
                >
                  Refresh Price
                </Button>
              </CardContent>
            </Card>
          </Paper>

          {/* 预测设置 */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Prediction Settings
            </Typography>
            <TextField
              fullWidth
              label="Prediction Days"
              size="small"
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value))))}
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={loadAll}
            >
              开始预测
            </Button>
          </Paper>
        </Grid>

        {/* 主内容 */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 0 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
              <Tab label="Summary" />
              <Tab label="Price Chart" />
              <Tab label="Volume Chart" />
              <Tab label="Details" />
            </Tabs>
            <Divider />

            {/* Summary */}
            {tab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Trend
                        </Typography>
                        <Chip
                          icon={predictionData?.prediction?.trend === 'bullish' ? <TrendingUp /> : <TrendingDown />}
                          label={predictionData?.prediction?.trend === 'bullish' ? 'Up' : 'Down'}
                          color={predictionData?.prediction?.trend === 'bullish' ? 'success' : 'error'}
                          sx={{ py: 1.5, px: 1.5 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Confidence
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(predictionData?.prediction?.confidence || 0) * 100}
                            sx={{ flexGrow: 1, height: 10, borderRadius: 1 }}
                          />
                          <Typography variant="h6" sx={{ minWidth: 56, textAlign: 'right' }}>
                            {((predictionData?.prediction?.confidence || 0) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          预测天数
                        </Typography>
                        <Typography variant="h4" component="div" color="primary">
                          {days} 天
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Price Chart */}
            {tab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <ShowChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {selectedAsset} 价格走势预测
                </Typography>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={preparePriceChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={getPriceDomain()} />
                    <Tooltip formatter={(v: any) => (typeof v === 'number' ? formatPrice(v) : v)} />
                    <Legend />
                    {/* 历史价格 */}
                    <Line type="monotone" dataKey="price" name="历史价格" stroke="#4FC3F7" dot={false} />
                    {/* 预测价格 */}
                    <Line type="monotone" dataKey="predicted" name="预测价格" stroke="#E6007A" strokeDasharray="5 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Volume Chart */}
            {tab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedAsset} 交易量分析
                </Typography>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={prepareVolumeData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={getVolumeDomain()} />
                    <Tooltip formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() : value} />
                    <Legend />
                    <Bar 
                      dataKey="historicalVolume" 
                      name="历史交易量" 
                      fill="#64B5F6"
                      radius={0}
                      isAnimationActive={false}
                    />
                    <Bar 
                      dataKey="predictedVolume" 
                      name="预测交易量" 
                      fill="#E57373"
                      radius={[10, 10, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* 表格：前半历史，后半预测 */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>交易量明细</Typography>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr 1fr',
                    columnGap: 2,
                    rowGap: 1,
                    '& > div': { py: 1, px: 1, bgcolor: 'background.paper', borderRadius: 1 }
                  }}>
                    <div><strong>时间</strong></div>
                    <div><strong>历史交易量</strong></div>
                    <div><strong>预测交易量</strong></div>
                    {(() => {
                      const volumeData = prepareVolumeData();
                      const items: any[] = [];
                      volumeData.forEach((item: any, idx: number) => {
                        items.push(
                          <React.Fragment key={idx}>
                            <div>{item.time}</div>
                            <div>{item.historicalVolume !== null ? item.historicalVolume.toLocaleString() : '-'}</div>
                            <div>{item.predictedVolume !== null ? item.predictedVolume.toLocaleString() : '-'}</div>
                          </React.Fragment>
                        );
                      });
                      return items;
                    })()}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Details */}
            {tab === 3 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Data Source: Binance | Model: {predictionData?.prediction?.model || 'Kronos'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Current Price: {predictionData ? formatPrice(predictionData.currentPrice) : '-'} | 24h Change: {predictionData ? formatChange(predictionData.change24h) : '-'}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* 提交预测 */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Submit Your Prediction
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label={`Your prediction for ${selectedAsset} in 24h (USD)`}
                  type="number"
                  value={userPrediction}
                  onChange={(e) => setUserPrediction(e.target.value)}
                  disabled={submitting}
                  placeholder={predictionData ? `AI suggests: ${predictionData.prediction?.price_24h?.toFixed(2)}` : ''}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                  onClick={handleSubmitPrediction}
                  disabled={submitting || !userPrediction}
                  sx={{ height: '56px' }}
                >
                  {submitting ? 'Submitting...' : 'Submit to Chain'}
                </Button>
              </Grid>
            </Grid>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Your prediction will be submitted to the Polkadot Westend testnet. 
                Rewards will be distributed based on prediction accuracy after 24 hours.
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictionPanel;

