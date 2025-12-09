#!/usr/bin/env python3
"""
KimpAI 텔레그램 시그널용 차트 생성 모듈
- 5분봉 Heikin-Ashi 캔들
- SMA20, EMA200
- RSI(14), MACD
- KST(한국시간) 기준
"""

import os
import sys
import requests
import pandas as pd
import numpy as np
import mplfinance as mpf
import matplotlib.pyplot as plt
from datetime import datetime
import pytz

KST = pytz.timezone("Asia/Seoul")

def fetch_klines(symbol: str, interval: str = "5m", limit: int = 100):
    """Binance에서 캔들 데이터 가져오기"""
    url = "https://api.binance.com/api/v3/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[Chart] Klines fetch error: {e}", file=sys.stderr)
        return pd.DataFrame()
    
    df = pd.DataFrame(data, columns=[
        "open_time", "open", "high", "low", "close", "volume",
        "close_time", "quote_volume", "trades",
        "buy_base", "buy_quote", "ignore"
    ])
    
    df["Open"] = df["open"].astype(float)
    df["High"] = df["high"].astype(float)
    df["Low"] = df["low"].astype(float)
    df["Close"] = df["close"].astype(float)
    df["Volume"] = df["volume"].astype(float)
    
    df["time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True).dt.tz_convert(KST)
    df.set_index("time", inplace=True)
    
    return df[["Open", "High", "Low", "Close", "Volume"]]


def to_heikin_ashi(df: pd.DataFrame) -> pd.DataFrame:
    """일반 캔들을 Heikin-Ashi로 변환"""
    ha = df.copy()
    ha["Close"] = (df["Open"] + df["High"] + df["Low"] + df["Close"]) / 4
    
    ha["Open"] = 0.0
    ha.iloc[0, ha.columns.get_loc("Open")] = (df["Open"].iloc[0] + df["Close"].iloc[0]) / 2
    
    for i in range(1, len(ha)):
        ha.iloc[i, ha.columns.get_loc("Open")] = (
            ha["Open"].iloc[i-1] + ha["Close"].iloc[i-1]
        ) / 2
    
    ha["High"] = ha[["Open", "Close", "High"]].max(axis=1)
    ha["Low"] = ha[["Open", "Close", "Low"]].min(axis=1)
    
    return ha


def calc_sma(series: pd.Series, window: int) -> pd.Series:
    """SMA 계산"""
    return series.rolling(window=window).mean()


def calc_ema(series: pd.Series, window: int) -> pd.Series:
    """EMA 계산"""
    return series.ewm(span=window, adjust=False).mean()


def calc_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """RSI 계산"""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    avg_gain = gain.ewm(span=period, adjust=False).mean()
    avg_loss = loss.ewm(span=period, adjust=False).mean()
    
    rs = avg_gain / (avg_loss + 1e-9)
    rsi = 100 - (100 / (1 + rs))
    return rsi


def calc_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    """MACD 계산"""
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def generate_signal_chart(symbol: str, interval: str = "5m") -> str:
    """
    Binance 캔들 데이터를 사용해 텔레그램용 차트를 생성한다.
    
    Args:
        symbol: "AVAXUSDT", "BTCUSDT" 같은 Binance 심볼
        interval: "5m" 고정
    
    Returns:
        생성된 PNG 파일의 절대 경로
    """
    df = fetch_klines(symbol, interval, limit=100)
    if df.empty or len(df) < 50:
        raise RuntimeError(f"Insufficient kline data for {symbol}")
    
    df = df.tail(50)
    
    ha_df = to_heikin_ashi(df)
    
    sma20 = calc_sma(df["Close"], 20)
    ema200_data = calc_ema(df["Close"], 200)
    rsi = calc_rsi(df["Close"], 14)
    macd_line, signal_line, macd_hist = calc_macd(df["Close"])
    
    mc = mpf.make_marketcolors(
        up='#26a69a',
        down='#ef5350',
        edge='inherit',
        wick='inherit',
        volume={'up': '#26a69a', 'down': '#ef5350'}
    )
    
    s = mpf.make_mpf_style(
        base_mpf_style='nightclouds',
        marketcolors=mc,
        gridstyle='-',
        gridcolor='#2a2a4a',
        facecolor='#1a1a2e',
        figcolor='#1a1a2e',
        rc={
            'axes.labelcolor': 'white',
            'axes.edgecolor': '#3a3a5a',
            'xtick.color': 'white',
            'ytick.color': 'white',
            'font.size': 9
        }
    )
    
    apds = []
    
    sma20_plot = mpf.make_addplot(sma20, color='#42a5f5', width=1.2, label='SMA20')
    apds.append(sma20_plot)
    
    ema200_plot = mpf.make_addplot(ema200_data, color='#ffd54f', width=1.5, linestyle='--', label='EMA200')
    apds.append(ema200_plot)
    
    rsi_plot = mpf.make_addplot(rsi, panel=2, color='#ab47bc', width=1.2, ylabel='RSI')
    apds.append(rsi_plot)
    
    rsi_70 = pd.Series([70] * len(df), index=df.index)
    rsi_30 = pd.Series([30] * len(df), index=df.index)
    apds.append(mpf.make_addplot(rsi_70, panel=2, color='#ff5252', width=0.8, linestyle='--'))
    apds.append(mpf.make_addplot(rsi_30, panel=2, color='#4caf50', width=0.8, linestyle='--'))
    
    colors = ['#26a69a' if v >= 0 else '#ef5350' for v in macd_hist]
    macd_hist_plot = mpf.make_addplot(macd_hist, panel=3, type='bar', color=colors, width=0.7, ylabel='MACD')
    apds.append(macd_hist_plot)
    
    macd_line_plot = mpf.make_addplot(macd_line, panel=3, color='#42a5f5', width=1)
    signal_line_plot = mpf.make_addplot(signal_line, panel=3, color='#ff7043', width=1)
    apds.append(macd_line_plot)
    apds.append(signal_line_plot)
    
    os.makedirs("/tmp/charts", exist_ok=True)
    out_path = f"/tmp/charts/{symbol}_{interval}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    
    fig, axes = mpf.plot(
        ha_df,
        type='candle',
        style=s,
        volume=True,
        addplot=apds,
        figsize=(12, 8),
        panel_ratios=(4, 1, 1.5, 1.5),
        title=f"\n{symbol} {interval} (Heikin-Ashi) - KST",
        ylabel='Price',
        ylabel_lower='Volume',
        returnfig=True,
        tight_layout=True
    )
    
    fig.savefig(out_path, dpi=110, bbox_inches='tight', facecolor='#1a1a2e')
    plt.close(fig)
    
    return out_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python priceChart.py SYMBOL [INTERVAL]")
        sys.exit(1)
    
    symbol = sys.argv[1].upper()
    interval = sys.argv[2] if len(sys.argv) > 2 else "5m"
    
    try:
        path = generate_signal_chart(symbol, interval)
        print(path)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
