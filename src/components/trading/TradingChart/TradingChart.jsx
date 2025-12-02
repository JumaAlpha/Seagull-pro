import React, { useEffect, useRef, useState } from 'react';
import styles from './TradingChart.module.css';

const TradingChart = ({ symbol = 'BTCUSDT', width = '100%', height = '100%' }) => {
  const containerRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeInterval, setTimeInterval] = useState('15');
  const [chartType, setChartType] = useState('candlestick');
  const [activeIndicators, setActiveIndicators] = useState({
    BB: true,
    RSI: true,
    MACD: false,
    Volume: true,
    MA: false,
  });
  const [showMobileControls, setShowMobileControls] = useState(false);

  const timeIntervals = [
    { label: '1m', value: '1', icon: '🕐' },
    { label: '5m', value: '5', icon: '🕐' },
    { label: '15m', value: '15', icon: '🕐' },
    { label: '30m', value: '30', icon: '🕐' },
    { label: '1h', value: '60', icon: '🕒' },
    { label: '4h', value: '240', icon: '🕓' },
    { label: '1D', value: '1D', icon: '📅' },
    { label: '1W', value: '1W', icon: '🗓️' },
  ];

  const chartTypes = [
    { label: 'Candles', value: 'candlestick', icon: '📊', style: '1' },
    { label: 'Line', value: 'line', icon: '📈', style: '2' },
    { label: 'Area', value: 'area', icon: '📉', style: '3' },
    { label: 'Bars', value: 'bars', icon: '📊', style: '0' },
  ];

  const indicators = [
    { id: 'BB', name: 'BB', icon: '📏', study: 'BB@tv-basicstudies' },
    { id: 'RSI', name: 'RSI', icon: '📊', study: 'RSI@tv-basicstudies' },
    { id: 'MACD', name: 'MACD', icon: '📈', study: 'MACD@tv-basicstudies' },
    { id: 'Volume', name: 'Vol', icon: '📊', study: 'Volume@tv-basicstudies' },
    { id: 'MA', name: 'MA', icon: '➖', study: 'MASimple@tv-basicstudies' },
  ];

  useEffect(() => {
    // Chart initialization code remains the same...
    // Keep your existing useEffect code here
  }, [symbol, timeInterval, chartType, activeIndicators]);

  // Handler functions remain the same...

  return (
    <div className={styles.tradingChartContainer} style={{ width: width, height: height }}>
      {/* Desktop Controls - Always visible */}
      <div className={styles.chartControlPanel}>
        <div className={styles.chartMainControls}>
          {/* TIME Controls - Compact */}
          <div className={styles.chartControlGroup}>
            <span className={styles.chartControlLabel}>TIME</span>
            <div className={styles.chartButtonGroup}>
              {timeIntervals.slice(0, 4).map(interval => (
                <button
                  key={interval.value}
                  className={`${styles.chartIconButton} ${timeInterval === interval.value ? styles.active : ''}`}
                  onClick={() => setTimeInterval(interval.value)}
                  title={interval.label}
                >
                  <span className={styles.chartButtonIcon}>{interval.icon}</span>
                  <span className={styles.chartButtonText}>{interval.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TYPE Controls - Compact */}
          <div className={styles.chartControlGroup}>
            <span className={styles.chartControlLabel}>TYPE</span>
            <div className={styles.chartButtonGroup}>
              {chartTypes.map(type => (
                <button
                  key={type.value}
                  className={`${styles.chartIconButton} ${chartType === type.value ? styles.active : ''}`}
                  onClick={() => setChartType(type.value)}
                  title={type.label}
                >
                  <span className={styles.chartButtonIcon}>{type.icon}</span>
                  <span className={styles.chartButtonText}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* INDICATORS Controls - Compact */}
          <div className={styles.chartControlGroup}>
            <span className={styles.chartControlLabel}>IND</span>
            <div className={styles.chartButtonGroup}>
              {indicators.map(indicator => (
                <button
                  key={indicator.id}
                  className={`${styles.chartIconButton} ${activeIndicators[indicator.id] ? styles.indicatorActive : ''}`}
                  onClick={() => setActiveIndicators(prev => ({
                    ...prev,
                    [indicator.id]: !prev[indicator.id]
                  }))}
                  title={indicator.name}
                >
                  <span className={styles.chartButtonIcon}>{indicator.icon}</span>
                  <span className={styles.chartButtonText}>{indicator.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button - Only on small screens */}
      <button 
        className={styles.mobileControlsToggle}
        onClick={() => setShowMobileControls(!showMobileControls)}
        title="Show/Hide Controls"
      >
        ⚙️
      </button>

      {/* Chart Area - Takes MOST of the space */}
      <div className={styles.chartAreaWrapper}>
        {/* Loading/Error states */}
        {isLoading && !error && (
          <div className={styles.chartPlaceholderState}>
            <div className={styles.placeholderContentWrapper}>
              <div className={styles.chartLoadingSpinner}></div>
              <h3>Loading Chart</h3>
              <p>Loading {symbol} chart...</p>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.chartPlaceholderState}>
            <div className={styles.placeholderContentWrapper}>
              <div className={styles.chartErrorIcon}>⚠️</div>
              <h3>Chart Unavailable</h3>
              <p>Failed to load TradingView chart</p>
              <div className={styles.chartRetrySection}>
                <button 
                  className={styles.chartRetryButton}
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        {!error && (
          <div 
            ref={containerRef}
            className={`${styles.tradingViewWidgetContainer} ${isLoading ? styles.loading : ''}`}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>

      {/* Mobile Floating Controls - Appears when toggle is clicked */}
      {showMobileControls && (
        <div className={styles.mobileFloatingControls}>
          <div className={styles.mobileControlsHeader}>
            <span>Chart Controls</span>
            <button 
              className={styles.closeMobileControls}
              onClick={() => setShowMobileControls(false)}
            >
              ✕
            </button>
          </div>
          
          <div className={styles.mobileControlsGrid}>
            {/* Time Interval Quick Select */}
            <div className={styles.mobileControlSection}>
              <div className={styles.mobileControlLabel}>Time Frame</div>
              <div className={styles.mobileButtonRow}>
                {timeIntervals.map(interval => (
                  <button
                    key={interval.value}
                    className={`${styles.mobileControlButton} ${timeInterval === interval.value ? styles.active : ''}`}
                    onClick={() => {
                      setTimeInterval(interval.value);
                      setShowMobileControls(false);
                    }}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Type Quick Select */}
            <div className={styles.mobileControlSection}>
              <div className={styles.mobileControlLabel}>Chart Type</div>
              <div className={styles.mobileButtonRow}>
                {chartTypes.map(type => (
                  <button
                    key={type.value}
                    className={`${styles.mobileControlButton} ${chartType === type.value ? styles.active : ''}`}
                    onClick={() => {
                      setChartType(type.value);
                      setShowMobileControls(false);
                    }}
                  >
                    {type.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Indicators Toggle */}
            <div className={styles.mobileControlSection}>
              <div className={styles.mobileControlLabel}>Indicators</div>
              <div className={styles.mobileButtonGrid}>
                {indicators.map(indicator => (
                  <button
                    key={indicator.id}
                    className={`${styles.mobileControlButton} ${activeIndicators[indicator.id] ? styles.indicatorActive : ''}`}
                    onClick={() => {
                      setActiveIndicators(prev => ({
                        ...prev,
                        [indicator.id]: !prev[indicator.id]
                      }));
                    }}
                  >
                    {indicator.icon} {indicator.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Time Frame Bar at Bottom (Mobile Only) */}
      <div className={styles.quickTimeFrameBar}>
        {['1m', '5m', '15m', '1h', '4h', '1D'].map(tf => (
          <button
            key={tf}
            className={`${styles.quickTimeButton} ${timeInterval === tf ? styles.active : ''}`}
            onClick={() => setTimeInterval(tf)}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TradingChart;
