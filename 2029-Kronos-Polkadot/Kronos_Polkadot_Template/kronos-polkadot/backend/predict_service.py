#!/usr/bin/env python3
"""
Kronos Prediction Service
使用 Kronos 模型进行加密货币价格预测
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')

# 添加 Kronos 模型路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'model'))

try:
    from model.kronos import Kronos, KronosTokenizer, KronosPredictor
    KRONOS_AVAILABLE = True
    print("✅ Kronos model loaded successfully")
except ImportError as e:
    print(f"⚠️  Kronos model not available: {e}")
    print("ℹ️  Will use fallback prediction method")
    KRONOS_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# 全局变量存储模型
predictor = None
tokenizer = None
model = None

def initialize_model():
    """初始化 Kronos 模型"""
    global predictor, tokenizer, model
    
    if not KRONOS_AVAILABLE:
        print("⚠️  Kronos not available, skipping model initialization")
        return False
    
    try:
        tokenizer_name = os.getenv('KRONOS_TOKENIZER', 'NeoQuasar/Kronos-Tokenizer-base')
        model_name = os.getenv('KRONOS_MODEL', 'NeoQuasar/Kronos-small')
        device = os.getenv('DEVICE', 'cpu')
        
        print(f"🔄 Loading tokenizer from {tokenizer_name}...")
        tokenizer = KronosTokenizer.from_pretrained(tokenizer_name)
        
        print(f"🔄 Loading model from {model_name}...")
        model = Kronos.from_pretrained(model_name)
        
        print(f"🔄 Initializing predictor on {device}...")
        predictor = KronosPredictor(model, tokenizer, device=device, max_context=512)
        
        print("✅ Kronos model initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Kronos model: {e}")
        return False

def prepare_data_from_history(prices, volumes=None):
    """
    将历史价格数据转换为 Kronos 所需的格式
    
    Args:
        prices: list of [timestamp, price]
        volumes: list of [timestamp, volume] (optional)
    
    Returns:
        DataFrame with OHLCV data
    """
    df_data = []
    
    for i in range(len(prices)):
        timestamp = datetime.fromtimestamp(prices[i][0] / 1000)
        price = prices[i][1]
        volume = volumes[i][1] if volumes and i < len(volumes) else 0
        
        # 简化处理：使用价格作为 OHLC
        # 在实际应用中，应该使用真实的 OHLC 数据
        df_data.append({
            'timestamps': timestamp,
            'open': price,
            'high': price * 1.01,  # 模拟高点
            'low': price * 0.99,   # 模拟低点
            'close': price,
            'volume': volume,
            'amount': price * volume if volume > 0 else 0
        })
    
    return pd.DataFrame(df_data)

def kronos_predict(symbol, historical_data, pred_hours=24):
    """
    使用 Kronos 模型进行预测
    
    Args:
        symbol: 交易对符号
        historical_data: 历史数据 {prices: [[timestamp, price], ...], volumes: [...]}
        pred_hours: 预测小时数
    
    Returns:
        预测结果
    """
    if not KRONOS_AVAILABLE or predictor is None:
        return None
    
    try:
        # 准备数据
        df = prepare_data_from_history(
            historical_data.get('prices', []),
            historical_data.get('volumes')
        )
        
        if len(df) < 50:  # 至少需要一些历史数据
            print(f"⚠️  Insufficient data: {len(df)} points")
            return None
        
        # 限制历史数据长度（Kronos max_context = 512）
        lookback = min(len(df), 400)
        
        # 准备输入数据
        x_df = df.iloc[-lookback:][['open', 'high', 'low', 'close', 'volume', 'amount']]
        x_timestamp = df.iloc[-lookback:]['timestamps']
        
        # 生成预测时间戳
        last_timestamp = df.iloc[-1]['timestamps']
        y_timestamp = pd.Series([
            last_timestamp + timedelta(hours=i) 
            for i in range(1, pred_hours + 1)
        ])
        
        print(f"🔮 Predicting {pred_hours} hours for {symbol}...")
        print(f"   Using {lookback} historical points")
        
        # 执行预测
        pred_df = predictor.predict(
            df=x_df,
            x_timestamp=x_timestamp,
            y_timestamp=y_timestamp,
            pred_len=pred_hours,
            T=1.0,
            top_p=0.9,
            sample_count=1,
            verbose=False
        )
        
        # 处理预测结果
        predictions = []
        for i, row in pred_df.iterrows():
            predictions.append({
                'hour': i + 1,
                'price': float(row['close']),
                'high': float(row['high']),
                'low': float(row['low']),
                'volume': float(row['volume']),
                'timestamp': y_timestamp.iloc[i].isoformat()
            })
        
        # 计算置信度（基于预测的方差）
        price_std = pred_df['close'].std()
        price_mean = pred_df['close'].mean()
        confidence = max(0.5, min(0.95, 1 - (price_std / price_mean)))
        
        # 判断趋势
        current_price = df.iloc[-1]['close']
        predicted_price_24h = float(pred_df.iloc[-1]['close'])
        trend = 'bullish' if predicted_price_24h > current_price else 'bearish'
        
        return {
            'price_24h': predicted_price_24h,
            'confidence': float(confidence),
            'trend': trend,
            'predictions': predictions,
            'model': 'kronos'
        }
        
    except Exception as e:
        print(f"❌ Kronos prediction error: {e}")
        import traceback
        traceback.print_exc()
        return None

def simple_predict(symbol, historical_data, pred_hours=24):
    """
    简单预测方法（后备方案）
    注意：pred_hours 参数名称保留，但实际按天生成预测
    """
    try:
        prices = historical_data.get('prices', [])
        volumes = historical_data.get('volumes', [])
        if not prices:
            return None
        
        price_values = [p[1] for p in prices]
        current_price = price_values[-1]
        
        # 处理交易量 - 按天聚合累加
        if volumes:
            # 按天分组累加交易量
            from collections import defaultdict
            daily_volumes = defaultdict(float)
            for v in volumes:
                # v 格式: [timestamp, volume]
                date_key = datetime.fromtimestamp(v[0] / 1000).date()
                daily_volumes[date_key] += v[1]
            volume_values = list(daily_volumes.values())
        else:
            volume_values = []
        
        current_volume = volume_values[-1] if volume_values else 1000000
        
        # 计算移动平均和趋势（按天而非按小时）
        ma7 = np.mean(price_values[-min(7, len(price_values)):])
        ma30 = np.mean(price_values[-min(30, len(price_values)):])
        
        trend = (ma7 - ma30) / ma30 if ma30 > 0 else 0
        
        # 计算交易量趋势
        vma7 = np.mean(volume_values[-min(7, len(volume_values)):]) if volume_values else current_volume
        vtrend = 0
        if volume_values and len(volume_values) > 0:
            vtrend = (current_volume - vma7) / vma7 if vma7 > 0 else 0
        
        # 按天生成预测（将 pred_hours 视为天数）
        pred_days = max(1, pred_hours)  # 默认为7天
        predictions = []
        
        for i in range(1, pred_days + 1):
            # 按天计算价格变化
            daily_change = trend * (i / pred_days)
            random_noise = (np.random.random() - 0.5) * 0.04
            predicted_price = current_price * (1 + daily_change + random_noise)
            
            # 预测每日交易量（与历史交易量同数量级）
            vol_random = (np.random.random() - 0.5) * 0.15
            predicted_volume = max(0, current_volume * (1 + vtrend * (i / pred_days) + vol_random))
            
            # 时间戳按天递增
            predictions.append({
                'hour': i,  # 保留字段名兼容性
                'price': float(predicted_price),
                'volume': float(predicted_volume),
                'timestamp': (datetime.now() + timedelta(days=i)).isoformat()
            })
        
        predicted_price_24h = predictions[-1]['price'] if predictions else current_price
        
        return {
            'price_24h': float(predicted_price_24h),
            'confidence': 0.6,
            'trend': 'bullish' if predicted_price_24h > current_price else 'bearish',
            'predictions': predictions,
            'model': 'simple'
        }
        
    except Exception as e:
        print(f"❌ Simple prediction error: {e}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'kronos_available': KRONOS_AVAILABLE and predictor is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """预测接口"""
    try:
        data = request.json
        symbol = data.get('symbol', 'BTC')
        historical_data = data.get('data', {})
        pred_hours = int(data.get('pred_hours', 24))
        
        # 尝试使用 Kronos 模型
        result = kronos_predict(symbol, historical_data, pred_hours)
        
        # 如果 Kronos 失败，使用简单预测
        if result is None:
            print("📊 Using simple prediction as fallback")
            result = simple_predict(symbol, historical_data, pred_hours)
        
        if result is None:
            return jsonify({'error': 'Prediction failed'}), 500
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Prediction endpoint error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    """根路由"""
    return jsonify({
        'service': 'Kronos Prediction Service',
        'version': '1.0.0',
        'kronos_available': KRONOS_AVAILABLE and predictor is not None,
        'endpoints': {
            'predict': 'POST /predict',
            'health': 'GET /health'
        }
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting Kronos Prediction Service")
    print("=" * 60)
    
    # 初始化模型
    model_loaded = initialize_model()
    
    if not model_loaded:
        print("⚠️  Running without Kronos model (fallback mode)")
    
    # 启动服务
    port = int(os.getenv('PYTHON_SERVICE_PORT', 5001))
    print(f"📡 Service running on http://localhost:{port}")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False)

