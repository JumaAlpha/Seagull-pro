import React, { useState, useEffect } from 'react';
import styles from './DashboardCard.module.css';
import { BinanceService } from '../../../services/binance';

const DashboardCard = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Popular crypto pairs
  const cryptoPairs = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 
    'ADAUSDT', 'DOTUSDT', 'LINKUSDT'
  ];

  const fetchMarketData = async () => {
    console.log('Fetching market data...');
    
    const result = await BinanceService.getMultipleTickers(cryptoPairs);
    
    if (result.success) {
      setAssets(result.data);
      setLastUpdate(new Date());
    } else {
      console.error('Error fetching data:', result.error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchMarketData();
    
    // Update every 10 seconds
    const interval = setInterval(fetchMarketData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else {
      return `$${volume.toFixed(0)}`;
    }
  };

  const getChangeColor = (change) => {
    return change >= 0 ? styles.positive : styles.negative;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={styles.dashboardCard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logoIcon}>⚡</span>
          <h1 className={styles.brandName}>Seagull-Pro</h1>
        </div>
        <div className={styles.liveIndicator}>
          <div className={`${styles.pulseDot} ${loading ? styles.pulsing : ''}`}></div>
          {loading ? 'UPDATING...' : 'LIVE PRICES'}
        </div>
      </header>

      {/* Last Update */}
      <div className={styles.lastUpdate}>
        Last update: {formatTime(lastUpdate)}
      </div>

      {/* Assets Grid */}
      <div className={styles.assetsGrid}>
        {assets.map((asset, index) => (
          <div key={asset.symbol} className={styles.assetCard}>
            <div className={styles.assetHeader}>
              <span className={styles.assetSymbol}>
                {asset.symbol.replace('USDT', '')}/USDT
              </span>
              <span className={`${styles.assetChange} ${getChangeColor(asset.change)}`}>
                {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className={styles.assetPrice}>
              {formatPrice(asset.price)}
            </div>
            <div className={styles.assetDetails}>
              <span className={styles.assetChangeAmount}>
                {asset.change >= 0 ? '+' : ''}{formatPrice(asset.change)}
              </span>
              <span className={styles.assetVolume}>
                Vol: {formatVolume(asset.volume)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className={styles.loadingMessage}>
          Loading market data from Binance...
        </div>
      )}
    </div>
  );
};

export default DashboardCard;