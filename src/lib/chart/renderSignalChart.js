const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800;
const height = 400;

let chartJSNodeCanvas = null;

function getChartRenderer() {
  if (!chartJSNodeCanvas) {
    chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width, 
      height,
      backgroundColour: '#1a1a2e'
    });
  }
  return chartJSNodeCanvas;
}

async function renderSignalChart(params) {
  const { symbol, candles, ema200 } = params;
  
  if (!candles || candles.length < 10) {
    throw new Error('Not enough candle data');
  }

  const renderer = getChartRenderer();

  const labels = candles.map(c => {
    const time = new Date(c.openTime || c.t || Date.now());
    return time.toISOString().slice(11, 16);
  });

  const closes = candles.map(c => parseFloat(c.close || c.c || 0));
  const highs = candles.map(c => parseFloat(c.high || c.h || 0));
  const lows = candles.map(c => parseFloat(c.low || c.l || 0));

  const datasets = [
    {
      type: 'line',
      label: `${symbol} Close`,
      data: closes,
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.1,
      pointRadius: 0,
    },
    {
      type: 'line',
      label: 'High',
      data: highs,
      borderColor: 'rgba(0, 255, 136, 0.3)',
      borderWidth: 1,
      fill: false,
      pointRadius: 0,
    },
    {
      type: 'line',
      label: 'Low',
      data: lows,
      borderColor: 'rgba(255, 107, 107, 0.3)',
      borderWidth: 1,
      fill: false,
      pointRadius: 0,
    }
  ];

  if (ema200 && ema200.length > 0) {
    datasets.push({
      type: 'line',
      label: 'EMA 200',
      data: ema200,
      borderColor: '#ffd700',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      pointRadius: 0,
    });
  }

  const configuration = {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { 
          display: true,
          labels: {
            color: '#ffffff',
            font: { size: 12 }
          }
        },
        title: {
          display: true,
          text: `${symbol} Price Chart`,
          color: '#ffffff',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        x: { 
          display: true,
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#888888', maxTicksLimit: 10 }
        },
        y: { 
          display: true,
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#888888' }
        },
      },
    },
  };

  const buffer = await renderer.renderToBuffer(configuration);
  return buffer;
}

module.exports = { renderSignalChart };
