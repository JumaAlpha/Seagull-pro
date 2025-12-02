import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './TradingChart.module.css';

const TradingChart = ({ symbol = 'BTCUSDT', width = '100%', height = '100%' }) => {
  const containerRef = useRef();
  const widgetRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartReady, setIsChartReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
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
  const [scriptLoaded, setScriptLoaded] = useState(false);

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

  // Load TradingView script once
  const loadTradingViewScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.TradingView) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load TradingView script'));
      };
      
      document.head.appendChild(script);
    });
  }, []);

  const initializeChart = useCallback(() => {
    if (!containerRef.current || !window.TradingView) return null;

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Clear previous widget if exists
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }

      // Create new widget
      const widget = new window.TradingView.widget({
        container_id: containerRef.current.id,
        width: '100%',
        height: '100%',
        symbol: `BINANCE:${symbol}`,
        interval: timeInterval,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: chartType === 'candlestick' ? '1' : 
               chartType === 'line' ? '2' : 
               chartType === 'area' ? '3' : '0',
        locale: 'en',
        toolbar_bg: '#1e1e2e',
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        studies: [
          ...(activeIndicators.BB ? ['BB@tv-basicstudies'] : []),
          ...(activeIndicators.RSI ? ['RSI@tv-basicstudies'] : []),
          ...(activeIndicators.MACD ? ['MACD@tv-basicstudies'] : []),
          ...(activeIndicators.Volume ? ['Volume@tv-basicstudies'] : []),
          ...(activeIndicators.MA ? ['MASimple@tv-basicstudies'] : []),
        ],
        disabled_features: [
          'use_localstorage_for_settings',
          'header_symbol_search',
          'symbol_search_hot_key',
          'display_market_status'
        ],
        enabled_features: [
          'study_templates',
          'hide_last_na_study_output'
        ],
        loading_screen: { backgroundColor: '#1e1e2e' },
        autosize: true,
        overrides: {
          'paneProperties.background': '#1e1e2e',
          'paneProperties.vertGridProperties.color': '#2d2d3d',
          'paneProperties.horzGridProperties.color': '#2d2d3d',
        },
        library_path: 'https://s3.tradingview.com/tv.js',
      });

      widgetRef.current = widget;

      // Handle widget ready event
      widget.onChartReady(() => {
        clearInterval(progressInterval);
        setLoadProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setIsChartReady(true);
        }, 300);
      });

      return widget;
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, [symbol, timeInterval, chartType, activeIndicators]);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const loadChart = async () => {
      try {
        setIsLoading(true);
        setIsChartReady(false);
        setLoadProgress(0);
        setError(null);

        // Load TradingView script if not loaded
        await loadTradingViewScript();

        if (!mounted) return;

        // Give a small delay for DOM to be ready
        timeoutId = setTimeout(() => {
          if (mounted) {
            initializeChart();
          }
        }, 100);
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    loadChart();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      // Cleanup widget
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error removing TradingView widget:', e);
        }
        widgetRef.current = null;
      }
    };
  }, [symbol, loadTradingViewScript, initializeChart]);

  // Debounced update for chart settings to avoid rapid re-renders
  useEffect(() => {
    if (!widgetRef.current || !isChartReady) return;

    const timeoutId = setTimeout(() => {
      try {
        if (widgetRef.current) {
          // Update chart type
          widgetRef.current.chart().setChartType(
            chartType === 'candlestick' ? 'Candles' :
            chartType === 'line' ? 'Line' :
            chartType === 'area' ? 'Area' : 'Bars'
          );

          // Update interval
          widgetRef.current.chart().setResolution(timeInterval, () => {
            console.log(`Interval changed to ${timeInterval}`);
          });

          // Update indicators
          const chart = widgetRef.current.chart();
          
          // Remove all studies first
          chart.getAllStudies().forEach(study => {
            chart.removeEntity(study.id);
          });

          // Add selected studies
          Object.entries(activeIndicators).forEach(([indicator, isActive]) => {
            if (isActive) {
              const studyConfig = indicators.find(i => i.id === indicator);
              if (studyConfig) {
                chart.createStudy(
                  studyConfig.study,
                  false,
                  false,
                  [],
                  (studyId) => {
                    console.log(`${indicator} added:`, studyId);
                  }
                );
              }
            }
          });
        }
      } catch (err) {
        console.warn('Error updating chart:', err);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [timeInterval, chartType, activeIndicators, isChartReady]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setLoadProgress(0);
    
    setTimeout(() => {
      initializeChart();
    }, 500);
  }, [initializeChart]);

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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
        disabled={isLoading}
      >
        ⚙️
      </button>

      {/* Chart Area - Takes MOST of the space */}
      <div className={styles.chartAreaWrapper}>
        {/* Loading State */}
        {isLoading && !error && (
          <div className={styles.chartPlaceholderState}>
            <div className={styles.placeholderContentWrapper}>
              <div className={styles.chartLoadingSpinner}>
                <div className={styles.spinnerCircle}></div>
                <div className={styles.loadingProgressBar}>
                  <div 
                    className={styles.loadingProgressFill}
                    style={{ width: `${loadProgress}%` }}
                  ></div>
                </div>
                <div className={styles.loadingPercentage}>
                  {loadProgress}%
                </div>
              </div>
              <h3>Loading Chart</h3>
              <p>Initializing {symbol} trading chart...</p>
              <div className={styles.loadingDetails}>
                <span className={styles.loadingDetail}>
                  {!scriptLoaded ? 'Loading TradingView...' : 
                   loadProgress < 30 ? 'Loading chart data...' :
                   loadProgress < 70 ? 'Applying indicators...' : 
                   'Finalizing...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.chartPlaceholderState}>
            <div className={styles.placeholderContentWrapper}>
              <div className={styles.chartErrorIcon}>⚠️</div>
              <h3>Chart Unavailable</h3>
              <p className={styles.errorMessage}>{error}</p>
              <div className={styles.chartRetrySection}>
                <button 
                  className={styles.chartRetryButton}
                  onClick={handleRetry}
                >
                  Retry Loading
                </button>
                <button 
                  className={styles.chartRetryButtonSecondary}
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart Container */}
        <div 
          ref={containerRef}
          id={`tradingview_${symbol}`}
          className={`${styles.tradingViewWidgetContainer} ${isLoading ? styles.loading : ''} ${isChartReady ? styles.ready : ''}`}
          style={{ 
            width: '100%', 
            height: '100%',
            opacity: isChartReady ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      </div>

      {/* Mobile Floating Controls */}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
            disabled={isLoading}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TradingChart;
