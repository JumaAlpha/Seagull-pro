import React, { useState, useEffect, useRef } from 'react';
import styles from './MiniChart.module.css';
import { BinanceService } from '../../../services/binance';

const MiniChart = ({ symbol = 'BTCUSDT', interval = '1h', limit = 24, showInfo = true, height = 100 }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [priceChange, setPriceChange] = useState({ value: 0, percent: 0, isPositive: true });
    
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    // Fetch chart data
    useEffect(() => {
        const fetchChartData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const result = await BinanceService.getChartData(symbol, interval, limit);
                
                if (result.success && result.data.length > 0) {
                    setChartData(result.data);
                    
                    // Calculate price change
                    const firstPrice = result.data[0].close;
                    const lastPrice = result.data[result.data.length - 1].close;
                    const changeValue = lastPrice - firstPrice;
                    const changePercent = (changeValue / firstPrice) * 100;
                    
                    setCurrentPrice(lastPrice);
                    setPriceChange({
                        value: Math.abs(changeValue),
                        percent: Math.abs(changePercent),
                        isPositive: changeValue >= 0
                    });
                } else {
                    throw new Error('No chart data available');
                }
            } catch (err) {
                console.error('Error fetching mini chart data:', err);
                setError('Failed to load chart data');
                // Generate mock data for demo
                generateMockData();
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();

        // Set up interval for real-time updates
        const intervalId = setInterval(fetchChartData, 30000); // Update every 30 seconds

        return () => clearInterval(intervalId);
    }, [symbol, interval, limit]);

    // Generate mock data for demo purposes
    const generateMockData = () => {
        const mockData = [];
        let basePrice = 45000;
        
        for (let i = 0; i < limit; i++) {
            const change = (Math.random() - 0.5) * 1000;
            basePrice += change;
            
            mockData.push({
                open: basePrice - Math.random() * 50,
                high: basePrice + Math.random() * 100,
                low: basePrice - Math.random() * 100,
                close: basePrice,
                time: Date.now() - (limit - i) * 3600000 // Mock timestamps
            });
        }
        
        setChartData(mockData);
        
        const firstPrice = mockData[0].close;
        const lastPrice = mockData[mockData.length - 1].close;
        const changeValue = lastPrice - firstPrice;
        const changePercent = (changeValue / firstPrice) * 100;
        
        setCurrentPrice(lastPrice);
        setPriceChange({
            value: Math.abs(changeValue),
            percent: Math.abs(changePercent),
            isPositive: changeValue >= 0
        });
    };

    // Format price with appropriate decimals
    const formatPrice = (price) => {
        if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
    };

    // Format percentage
    const formatPercent = (percent) => {
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    // Calculate SVG path for line chart
    const getChartPath = () => {
        if (!chartData.length || !svgRef.current) return '';
        
        const svgWidth = svgRef.current.clientWidth;
        const svgHeight = height;
        
        const prices = chartData.map(d => d.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        
        // Add padding to range to avoid edges
        const padding = priceRange * 0.1;
        const paddedMin = minPrice - padding;
        const paddedRange = priceRange + padding * 2;
        
        const points = chartData.map((data, index) => {
            const x = (index / (chartData.length - 1)) * svgWidth;
            const y = svgHeight - ((data.close - paddedMin) / paddedRange) * svgHeight;
            return `${x},${y}`;
        });
        
        return `M${points.join(' L')}`;
    };

    // Calculate area path for gradient fill
    const getAreaPath = () => {
        if (!chartData.length || !svgRef.current) return '';
        
        const svgWidth = svgRef.current.clientWidth;
        const svgHeight = height;
        
        const prices = chartData.map(d => d.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        
        // Add padding to range to avoid edges
        const padding = priceRange * 0.1;
        const paddedMin = minPrice - padding;
        const paddedRange = priceRange + padding * 2;
        
        const points = chartData.map((data, index) => {
            const x = (index / (chartData.length - 1)) * svgWidth;
            const y = svgHeight - ((data.close - paddedMin) / paddedRange) * svgHeight;
            return `${x},${y}`;
        });
        
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        
        return `M${firstPoint} L${points.join(' L')} L${lastPoint.split(',')[0]},${svgHeight} L${firstPoint.split(',')[0]},${svgHeight} Z`;
    };

    // Calculate gradient colors based on price trend
    const getGradientColors = () => {
        if (!chartData.length) return ['#10B981', '#059669']; // Default green
        
        const firstPrice = chartData[0].close;
        const lastPrice = chartData[chartData.length - 1].close;
        const isPositive = lastPrice >= firstPrice;
        
        if (isPositive) {
            return ['#10B981', '#059669']; // Green gradient
        } else {
            return ['#EF4444', '#DC2626']; // Red gradient
        }
    };

    // Get interval label
    const getIntervalLabel = () => {
        switch (interval) {
            case '1m': return '1M';
            case '5m': return '5M';
            case '15m': return '15M';
            case '1h': return '1H';
            case '4h': return '4H';
            case '1d': return '1D';
            case '1w': return '1W';
            default: return interval;
        }
    };

    if (loading) {
        return (
            <div className={styles.miniChartContainer} style={{ height: `${height}px` }}>
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading chart...</p>
                </div>
            </div>
        );
    }

    if (error && chartData.length === 0) {
        return (
            <div className={styles.miniChartContainer} style={{ height: `${height}px` }}>
                <div className={styles.errorState}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <p>Chart unavailable</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className={styles.miniChartContainer}
            style={{ height: `${height}px` }}
        >
            {showInfo && (
                <div className={styles.chartHeader}>
                    <div className={styles.symbolInfo}>
                        <span className={styles.symbol}>
                            {symbol.replace('USDT', '')}/USDT
                        </span>
                        <span className={styles.intervalLabel}>
                            {getIntervalLabel()}
                        </span>
                    </div>
                    <div className={styles.priceInfo}>
                        <span className={styles.currentPrice}>
                            {formatPrice(currentPrice)}
                        </span>
                        <span className={`${styles.priceChange} ${priceChange.isPositive ? styles.positive : styles.negative}`}>
                            {formatPercent(priceChange.isPositive ? priceChange.percent : -priceChange.percent)}
                        </span>
                    </div>
                </div>
            )}

            <div className={styles.chartArea}>
                <svg 
                    ref={svgRef}
                    className={styles.chartSvg}
                    width="100%"
                    height={showInfo ? height - 40 : height} // Adjust height based on header
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient 
                            id={`gradient-${symbol}`} 
                            x1="0%" 
                            y1="0%" 
                            x2="0%" 
                            y2="100%"
                        >
                            <stop 
                                offset="0%" 
                                stopColor={getGradientColors()[0]}
                                stopOpacity="0.3"
                            />
                            <stop 
                                offset="100%" 
                                stopColor={getGradientColors()[1]}
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                    
                    {/* Area fill */}
                    <path
                        d={getAreaPath()}
                        fill={`url(#gradient-${symbol})`}
                        className={styles.chartAreaFill}
                    />
                    
                    {/* Line */}
                    <path
                        d={getChartPath()}
                        fill="none"
                        stroke={priceChange.isPositive ? '#10B981' : '#EF4444'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={styles.chartLine}
                    />
                    
                    {/* Current price indicator */}
                    {chartData.length > 0 && (
                        <circle
                            cx="100%"
                            cy={(height - 40) * 0.5} // Center vertically in chart area
                            r="3"
                            fill={priceChange.isPositive ? '#10B981' : '#EF4444'}
                            className={styles.currentPriceIndicator}
                        />
                    )}
                </svg>
                
                {/* Price levels */}
                <div className={styles.priceLevels}>
                    {chartData.length > 0 && (
                        <>
                            <span className={styles.highPrice}>
                                {formatPrice(Math.max(...chartData.map(d => d.high)))}
                            </span>
                            <span className={styles.lowPrice}>
                                {formatPrice(Math.min(...chartData.map(d => d.low)))}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Volume indicator (simplified) */}
            {showInfo && chartData.length > 0 && (
                <div className={styles.volumeIndicator}>
                    <div className={styles.volumeBar}>
                        <div 
                            className={`${styles.volumeFill} ${priceChange.isPositive ? styles.volumePositive : styles.volumeNegative}`}
                            style={{ 
                                width: `${Math.min(100, chartData[chartData.length - 1].volume / 1000000)}%` 
                            }}
                        />
                    </div>
                    <span className={styles.volumeText}>
                        Vol: {chartData[chartData.length - 1].volume?.toLocaleString('en-US', { 
                            notation: 'compact',
                            compactDisplay: 'short'
                        }) || 'N/A'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default MiniChart;