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
    let isMounted = true;
    let widgetInstance = null;
    
    const initializeChart = async () => {
      if (!containerRef.current || !isMounted) return;

      try {
        setIsLoading(true);
        setError(null);

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create widget container
        const widgetContainer = document.createElement('div');
        const uniqueId = `tradingview-${symbol.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        widgetContainer.id = uniqueId;
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        
        containerRef.current.appendChild(widgetContainer);

        // Load TradingView script if needed
        if (!window.TradingView) {
          await loadTradingViewScript();
        }

        if (isMounted && window.TradingView) {
          createWidget(uniqueId);
        }

      } catch (err) {
        console.error('Chart initialization error:', err);
        if (isMounted) {
          setError('Failed to load TradingView chart');
          setIsLoading(false);
        }
      }
    };

    const loadTradingViewScript = () => {
      return new Promise((resolve, reject) => {
        if (window.TradingView) {
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src*="tradingview.com/tv.js"]');
        if (existingScript) {
          existingScript.onload = () => resolve();
          existingScript.onerror = () => reject(new Error('Script load failed'));
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.async = true;
        
        script.onload = () => {
          setTimeout(() => {
            if (window.TradingView) {
              resolve();
            } else {
              reject(new Error('TradingView not available'));
            }
          }, 500);
        };
        
        script.onerror = () => reject(new Error('Failed to load TradingView script'));

        document.head.appendChild(script);
      });
    };

    const createWidget = (containerId) => {
      try {
        // Clean up previous widget
        if (widgetInstance) {
          try {
            // TradingView doesn't have proper destroy method, but we can remove the container
          } catch (e) {}
        }

        // Get active studies
        const activeStudies = indicators
          .filter(ind => activeIndicators[ind.id])
          .map(ind => ind.study);

        // Get chart style
        const selectedChartType = chartTypes.find(ct => ct.value === chartType);
        const chartStyle = selectedChartType ? selectedChartType.style : '1';

        // Create widget with autosize to fill parent container
        widgetInstance = new window.TradingView.widget({
          autosize: true, // This makes the chart fill its container
          symbol: `BINANCE:${symbol}`,
          interval: timeInterval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: chartStyle,
          locale: 'en',
          toolbar_bg: '#131722',
          enable_publishing: false,
          withdateranges: true,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          save_image: false,
          details: false,
          hotlist: false,
          calendar: false,
          show_popup_button: false,
          container_id: containerId,
          studies: activeStudies,
          disabled_features: [
            'use_localstorage_for_settings',
            'header_widget'
          ],
          enabled_features: [
            'study_templates'
          ],
          overrides: {
            "paneProperties.background": "#131722",
            "paneProperties.vertGridProperties.color": "rgba(255, 255, 255, 0.06)",
            "paneProperties.horzGridProperties.color": "rgba(255, 255, 255, 0.06)",
          }
        });

        setTimeout(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        }, 1500);

      } catch (err) {
        console.error('Error creating widget:', err);
        if (isMounted) {
          setError('Failed to create TradingView widget');
          setIsLoading(false);
        }
      }
    };

    initializeChart();

    // Cleanup function
    return () => {
      isMounted = false;
      widgetInstance = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, timeInterval, chartType, activeIndicators]);

  const handleIndicatorToggle = (indicatorId) => {
    setActiveIndicators(prev => ({
      ...prev,
      [indicatorId]: !prev[indicatorId]
    }));
  };

  const handleTimeIntervalChange = (interval) => {
    setTimeInterval(interval);
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  return (
    <div className={styles.tradingContainer} style={{ width: width, height: height }}>
      <div className={styles.controlPanel}>
        {/* Main Controls Row - TIME, TYPE, INDICATORS */}
        <div className={styles.mainControls}>
          {/* TIME Controls */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>TIME</span>
            <div className={`${styles.buttonGroup} ${styles.timeButtons}`}>
              {timeIntervals.map(interval => (
                <button
                  key={interval.value}
                  className={`${styles.iconButton} ${timeInterval === interval.value ? styles.active : ''}`}
                  onClick={() => handleTimeIntervalChange(interval.value)}
                  title={interval.label}
                >
                  <span className={styles.buttonIcon}>{interval.icon}</span>
                  <span>{interval.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TYPE Controls */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>TYPE</span>
            <div className={`${styles.buttonGroup} ${styles.typeButtons}`}>
              {chartTypes.map(type => (
                <button
                  key={type.value}
                  className={`${styles.iconButton} ${chartType === type.value ? styles.active : ''}`}
                  onClick={() => handleChartTypeChange(type.value)}
                  title={type.label}
                >
                  <span className={styles.buttonIcon}>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* INDICATORS Controls */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>INDICATORS</span>
            <div className={`${styles.buttonGroup} ${styles.indicatorButtons}`}>
              {indicators.map(indicator => (
                <button
                  key={indicator.id}
                  className={`${styles.iconButton} ${activeIndicators[indicator.id] ? styles.indicatorActive : ''}`}
                  onClick={() => handleIndicatorToggle(indicator.id)}
                  title={indicator.name}
                >
                  <span className={styles.buttonIcon}>{indicator.icon}</span>
                  <span>{indicator.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area - Will expand to fill available space */}
      <div className={styles.chartArea}>
        {/* Loading State */}
        {isLoading && !error && (
          <div className={styles.chartPlaceholder}>
            <div className={styles.placeholderContent}>
              <div className={styles.loadingSpinner}></div>
              <h3>Loading Chart</h3>
              <p>Loading {symbol} price chart with selected indicators...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.chartPlaceholder}>
            <div className={styles.placeholderContent}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Chart Unavailable</h3>
              <p>Failed to load TradingView chart</p>
              <div className={styles.retrySection}>
                <button 
                  className={styles.retryButton}
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart Container */}
        {!error && (
          <div 
            ref={containerRef}
            className={`${styles.chartContainer} ${isLoading ? styles.loading : ''}`}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default TradingChart;