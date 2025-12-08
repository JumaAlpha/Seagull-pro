import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Trading.module.css';
import { BinanceService } from '../../services/binance';
import { WalletService } from '../../services/wallet';
import TradingChart from '../../components/trading/TradingChart/TradingChart';
import OrderBook from '../../components/trading/OrderBook/OrderBook';
import MiniChart from '../../components/trading/Minichart/MiniChart';

const Trading = () => {
    const { symbol = 'BTCUSDT' } = useParams();
    const navigate = useNavigate();

    // State management
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('volume');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMarketsDropdownOpen, setIsMarketsDropdownOpen] = useState(false);
    const [isTradePanelOpen, setIsTradePanelOpen] = useState(false);

    // Trading state
    const [tradeType, setTradeType] = useState('buy');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [orderHistory, setOrderHistory] = useState([]);

    // Wallet state
    const [wallet, setWallet] = useState(() => WalletService.getWallet());
    const [portfolioValue, setPortfolioValue] = useState(0);

    // Real-time data states
    const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
    const [recentTrades, setRecentTrades] = useState([]);
    const [isLoadingOrderBook, setIsLoadingOrderBook] = useState(true);
    const [chartData, setChartData] = useState([]);
    
    // Market stats
    const [marketStats, setMarketStats] = useState({
        high24h: 0,
        low24h: 0,
        volume: 0
    });

    // Swipe gesture states
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const swipeContainerRef = useRef(null);

    // The minimum swipe distance required to trigger the trade panel
    const minSwipeDistance = 50;

    // Memoized values
    const selectedAsset = useMemo(() => {
        return assets.find(asset => asset.symbol === symbol) || null;
    }, [assets, symbol]);

    const filteredAssets = useMemo(() => {
        if (!assets.length) return [];

        let filtered = assets.filter(asset =>
            asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'volume':
                    return b.volume - a.volume;
                case 'change':
                    return Math.abs(b.changePercent) - Math.abs(a.changePercent);
                case 'symbol':
                    return a.symbol.localeCompare(b.symbol);
                default:
                    return b.volume - a.volume;
            }
        });

        return filtered;
    }, [assets, searchTerm, sortBy]);

    // Format functions
    const formatPrice = useCallback((price) => {
        if (isNaN(price) || price === null || price === undefined) {
            return '$0.00';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(price);
    }, []);

    const formatVolume = useCallback((volume) => {
        if (!volume || isNaN(volume)) return '$0';
        if (volume >= 1000000000) return `$${(volume / 1000000000).toFixed(1)}B`;
        if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
        return `$${volume.toFixed(0)}`;
    }, []);

    const getChangeColor = useCallback((change) => {
        return change >= 0 ? styles.positive : styles.negative;
    }, []);

    // Touch gesture handlers
    const onTouchStart = useCallback((e) => {
        if (window.innerWidth <= 768) { // Only on mobile
            setTouchEnd(null);
            setTouchStart(e.targetTouches[0].clientX);
            setIsSwiping(true);
        }
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!touchStart || window.innerWidth > 768) return;
        
        const currentX = e.targetTouches[0].clientX;
        const distance = touchStart - currentX;
        
        // Visual feedback for swipe
        if (distance > 0) {
            setTouchEnd(currentX);
        }
    }, [touchStart]);

    const onTouchEnd = useCallback(() => {
        if (!touchStart || !touchEnd || window.innerWidth > 768) {
            setIsSwiping(false);
            return;
        }
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        
        if (isLeftSwipe) {
            // Open trade panel on right-to-left swipe
            setIsTradePanelOpen(true);
        }
        
        // Reset
        setTouchStart(null);
        setTouchEnd(null);
        setIsSwiping(false);
    }, [touchStart, touchEnd]);

    // Handle mouse drag for desktop testing
    const onMouseDown = useCallback((e) => {
        if (window.innerWidth <= 768) {
            setTouchStart(e.clientX);
            setIsSwiping(true);
        }
    }, []);

    const onMouseMove = useCallback((e) => {
        if (!touchStart || window.innerWidth > 768 || !isSwiping) return;
        
        const currentX = e.clientX;
        setTouchEnd(currentX);
    }, [touchStart, isSwiping]);

    const onMouseUp = useCallback(() => {
        if (!touchStart || !touchEnd || window.innerWidth > 768) {
            setIsSwiping(false);
            return;
        }
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        
        if (isLeftSwipe) {
            setIsTradePanelOpen(true);
        }
        
        setTouchStart(null);
        setTouchEnd(null);
        setIsSwiping(false);
    }, [touchStart, touchEnd]);

    // Data fetching
    const fetchMarketData = useCallback(async () => {
        try {
            const result = await BinanceService.getAllUSDTPairs();
            if (result.success) {
                setAssets(result.data);
                
                // Calculate portfolio value
                const currentPrices = {};
                result.data.forEach(asset => {
                    currentPrices[asset.symbol] = asset.price;
                });
                setPortfolioValue(WalletService.getPortfolioValue(currentPrices));
                
                // Find and set current asset stats
                const currentAsset = result.data.find(a => a.symbol === symbol);
                if (currentAsset) {
                    setMarketStats({
                        high24h: currentAsset.high24h || 0,
                        low24h: currentAsset.low24h || 0,
                        volume: currentAsset.volume || 0
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching market data:', error);
        }
    }, [symbol]);

    const fetchRealTimeData = useCallback(async (currentSymbol) => {
        if (!currentSymbol) return;

        try {
            setIsLoadingOrderBook(true);
            const [orderBookResult, tradesResult, chartResult] = await Promise.all([
                BinanceService.getOrderBook(currentSymbol, 20),
                BinanceService.getRecentTrades(currentSymbol, 10),
                BinanceService.getChartData(currentSymbol, '1h', 24)
            ]);

            if (orderBookResult.success) setOrderBook(orderBookResult.data);
            if (tradesResult.success) setRecentTrades(tradesResult.data);
            if (chartResult.success) setChartData(chartResult.data);
            setIsLoadingOrderBook(false);
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            setIsLoadingOrderBook(false);
        }
    }, []);

    // Effects
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchMarketData();
            setLoading(false);
        };
        loadInitialData();
    }, [fetchMarketData]);

    useEffect(() => {
        if (symbol) {
            fetchRealTimeData(symbol);
        }
    }, [symbol, fetchRealTimeData]);

    useEffect(() => {
        if (selectedAsset) {
            setPrice(selectedAsset.price.toString());
            // Update market stats
            setMarketStats({
                high24h: selectedAsset.high24h || 0,
                low24h: selectedAsset.low24h || 0,
                volume: selectedAsset.volume || 0
            });
        }
    }, [selectedAsset]);

    useEffect(() => {
        const visitCount = localStorage.getItem('tradingPageVisits') || 0;
        const newCount = parseInt(visitCount) + 1;
        localStorage.setItem('tradingPageVisits', newCount.toString());
        
        if (newCount <= 3) {
            setShowSwipeHint(true);
            // Auto hide after 5 seconds
            const timer = setTimeout(() => {
                setShowSwipeHint(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Event handlers
    const handleAssetSelect = useCallback((assetSymbol) => {
        navigate(`/trading/${assetSymbol}`);
        setIsSidebarOpen(false);
        setIsMarketsDropdownOpen(false);
    }, [navigate]);

    const handleTrade = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!amount || !price || !selectedAsset) return;

        const tradeAmount = parseFloat(amount);
        const tradePrice = parseFloat(price);
        const totalCost = tradeAmount * tradePrice;

        if (tradeAmount <= 0 || tradePrice <= 0 || isNaN(tradeAmount) || isNaN(tradePrice)) {
            alert('Please enter valid amount and price');
            return;
        }

        try {
            let newWallet;
            if (tradeType === 'buy') {
                newWallet = WalletService.buyAsset(selectedAsset.symbol, tradeAmount, tradePrice);
            } else {
                newWallet = WalletService.sellAsset(selectedAsset.symbol, tradeAmount, tradePrice);
            }

            setWallet(newWallet);

            // Update portfolio value
            const currentPrices = {};
            assets.forEach(asset => {
                currentPrices[asset.symbol] = asset.price;
            });
            setPortfolioValue(WalletService.getPortfolioValue(currentPrices));

            // Add to order history
            const trade = {
                id: Date.now(),
                symbol: selectedAsset.symbol,
                type: tradeType,
                amount: tradeAmount,
                price: tradePrice,
                total: totalCost,
                timestamp: new Date(),
                status: 'filled'
            };

            setOrderHistory(prev => [trade, ...prev.slice(0, 9)]);
            setAmount('');
            
            // Show success message
            alert(`${tradeType.toUpperCase()} order executed: ${tradeAmount} ${selectedAsset.symbol.replace('USDT', '')} at $${tradePrice}`);

        } catch (error) {
            alert(`Trade failed: ${error.message}`);
        }
    }, [amount, price, selectedAsset, tradeType, assets]);

    // Utility functions
    const getAssetBalance = useCallback((assetSymbol) => {
        return WalletService.getAssetBalance(assetSymbol);
    }, []);

    if (loading && assets.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading trading data...</p>
            </div>
        );
    }

    return (
        <div 
            className={`${styles.tradingPage} ${showSwipeHint ? styles.showSwipeHint : ''}`}
            ref={swipeContainerRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
        >
            {/* Header */}
            <header className={styles.header}>
                {/* Left Section - Brand & Navigation */}
                <div className={styles.headerLeft}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        ☰
                    </button>
                    
                    <div className={styles.brand}>
                        <div className={styles.logoIcon}>
                            ⚡
                        </div>
                        <h1 className={styles.brandName}>Seagull-Pro</h1>
                    </div>
                    
                    {/* Network Status - Desktop only */}
                    <div className={styles.networkStatus}>
                        <div className={styles.statusDot}></div>
                        <span>Live</span>
                    </div>
                </div>

                {/* Center Section - Symbol Info & Stats */}
                <div className={styles.headerCenter}>
                    {selectedAsset && (
                        <div className={styles.symbolInfo}>
                            <div className={styles.symbolName}>
                                <div className={styles.symbolIcon}>
                                    {selectedAsset.symbol.slice(0, 1)}
                                </div>
                                {selectedAsset.symbol.replace('USDT', '')}/USDT
                            </div>
                            <span className={styles.currentPrice}>
                                {formatPrice(selectedAsset.price)}
                            </span>
                            <span className={`${styles.priceChange} ${getChangeColor(selectedAsset.change)}`}>
                                {selectedAsset.changePercent >= 0 ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    )}
                    
                    {/* Market Stats - Desktop only */}
                    <div className={styles.marketStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>24h High</span>
                            <span className={styles.statValue}>
                                {formatPrice(marketStats.high24h)}
                            </span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>24h Low</span>
                            <span className={styles.statValue}>
                                {formatPrice(marketStats.low24h)}
                            </span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>24h Volume</span>
                            <span className={styles.statValue}>
                                {formatVolume(marketStats.volume)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Section - Actions & Balances */}
                <div className={styles.headerRight}>
                    {/* Search Bar - Desktop only */}
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {/* Time Display - Desktop only */}
                    <div className={styles.timeDisplay}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    {/* Mobile Markets Dropdown */}
                    <div className={styles.mobileMarkets}>
                        <button
                            className={styles.marketsToggle}
                            onClick={() => setIsMarketsDropdownOpen(!isMarketsDropdownOpen)}
                        >
                            Markets ▼
                        </button>
                        {isMarketsDropdownOpen && (
                            <div className={styles.marketsDropdown}>
                                <div className={styles.marketControls}>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className={styles.sortSelect}
                                    >
                                        <option value="volume">Volume</option>
                                        <option value="change">Change</option>
                                        <option value="symbol">Symbol</option>
                                    </select>
                                </div>
                                <div className={styles.marketsList}>
                                    {filteredAssets.slice(0, 8).map((asset) => {
                                        const userBalance = getAssetBalance(asset.symbol);
                                        return (
                                            <div
                                                key={asset.symbol}
                                                className={`${styles.marketItem} ${asset.symbol === symbol ? styles.selected : ''}`}
                                                onClick={() => handleAssetSelect(asset.symbol)}
                                            >
                                                <div className={styles.marketMain}>
                                                    <span className={styles.marketSymbol}>
                                                        {asset.symbol.replace('USDT', '')}
                                                        {userBalance > 0 && <span className={styles.ownedBadge} />}
                                                    </span>
                                                    <span className={styles.marketPrice}>
                                                        {formatPrice(asset.price)}
                                                    </span>
                                                </div>
                                                <div className={styles.marketStats}>
                                                    <span className={`${styles.marketChange} ${getChangeColor(asset.change)}`}>
                                                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Balances */}
                    <div className={styles.headerBalances}>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceLabel}>Portfolio</span>
                            <span className={styles.balanceAmount}>{formatPrice(portfolioValue)}</span>
                        </div>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceLabel}>USDT</span>
                            <span className={styles.balanceAmount}>{formatPrice(wallet.usdt)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.headerActions}>
                        <button
                            className={styles.tradeButton}
                            onClick={() => setIsTradePanelOpen(true)}
                        >
                            <span>📈</span>
                            <span>Trade</span>
                        </button>
                        <button className={`${styles.headerBtn}`} onClick={() => navigate('/wallet')}>
                            💰
                        </button>
                        <button className={styles.headerBtn} onClick={() => navigate('/dashboard')}>
                            📊
                        </button>
                    </div>
                </div>
            </header>

            {/* Swipe Indicator */}
            <div 
                className={styles.swipeIndicator}
                style={{
                    opacity: isSwiping && touchEnd ? 0.3 : 0,
                    transform: `translateX(${touchEnd ? -(touchStart - touchEnd) : 0}px)`
                }}
            >
                ← Swipe to open trade panel
            </div>

            {/* Swipe Handle */}
            <div className={styles.swipeHandle} />

            {/* Main Trading Interface */}
            <div className={styles.tradingLayout}>
                {/* Sidebar */}
                <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                    {/* Markets List */}
                    <div className={styles.panelSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>Markets</h3>
                            <div className={styles.marketControls}>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={styles.searchInput}
                                />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={styles.sortSelect}
                                >
                                    <option value="volume">Volume</option>
                                    <option value="change">Change</option>
                                    <option value="symbol">Symbol</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.marketsList}>
                            {filteredAssets.slice(0, 12).map((asset) => {
                                const userBalance = getAssetBalance(asset.symbol);
                                return (
                                    <div
                                        key={asset.symbol}
                                        className={`${styles.marketItem} ${asset.symbol === symbol ? styles.selected : ''}`}
                                        onClick={() => handleAssetSelect(asset.symbol)}
                                    >
                                        <div className={styles.marketMain}>
                                            <span className={styles.marketSymbol}>
                                                {asset.symbol.replace('USDT', '')}
                                                {userBalance > 0 && <span className={styles.ownedBadge} />}
                                            </span>
                                            <span className={styles.marketPrice}>
                                                {formatPrice(asset.price)}
                                            </span>
                                        </div>
                                        <div className={styles.marketStats}>
                                            <span className={`${styles.marketChange} ${getChangeColor(asset.change)}`}>
                                                {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Book */}
                    <div className={styles.panelSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>Order Book</h3>
                        </div>
                        {isLoadingOrderBook ? (
                            <div className={styles.loadingState}>
                                <div className={styles.loadingSpinner}></div>
                            </div>
                        ) : (
                            <OrderBook bids={orderBook.bids} asks={orderBook.asks} />
                        )}
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className={styles.sidebarOverlay}
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Center Panel - Chart */}
                <div className={styles.centerPanel}>
                    <div className={styles.tradingChartWrapper}>
                      <TradingChart symbol={symbol} key={symbol} />
                    </div>

                    {/* Recent Trades */}
                    <div className={styles.recentTradesSection}>
                        <h4 className={styles.sectionTitle}>Recent Trades</h4>
                        <div className={styles.recentTrades}>
                            {recentTrades.slice(0, 6).map((trade, index) => (
                                <div key={trade.id || index} className={styles.tradeItem}>
                                    <span className={trade.isBuyerMaker ? styles.sellTrade : styles.buyTrade}>
                                        {formatPrice(trade.price)}
                                    </span>
                                    <span className={styles.tradeAmount}>
                                        {parseFloat(trade.quantity).toFixed(4)}
                                    </span>
                                    <span className={styles.tradeTime}>
                                        {new Date(trade.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trade Panel Sidebar */}
            <div className={`${styles.tradePanel} ${isTradePanelOpen ? styles.tradePanelOpen : ''}`}>
                <div className={styles.tradePanelHeader}>
                    <button
                        className={styles.closePanelBtn}
                        onClick={() => setIsTradePanelOpen(false)}
                    >
                        ✕
                    </button>
                    <h3 className={styles.tradePanelTitle}>Trade Panel</h3>
                </div>

                <div className={styles.tradePanelContent}>
                    {/* Floating Mini Chart */}
                    <div className={styles.floatingChart}>
                        {chartData.length > 0 ? (
                            <MiniChart
                                symbol={symbol}
                                interval="1m"
                                limit={24}
                                height={120}
                            />
                        ) : (
                            <div className={styles.miniChartPlaceholder}>
                                <div className={styles.loadingSpinner}></div>
                                Loading chart...
                            </div>
                        )}
                    </div>

                    {selectedAsset && (
                        <div className={styles.assetInfo}>
                            <div className={styles.assetHeader}>
                                <span className={styles.assetSymbol}>
                                    {selectedAsset.symbol.replace('USDT', '')}
                                </span>
                                <span className={styles.assetBalance}>
                                    Balance: {getAssetBalance(selectedAsset.symbol).toFixed(4)}
                                </span>
                            </div>
                            <div className={styles.assetPrice}>
                                Current: {formatPrice(selectedAsset.price)}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleTrade} className={styles.tradeForm}>
                        <div className={styles.tradeTypeSelector}>
                            <button
                                type="button"
                                className={`${styles.tradeTypeBtn} ${tradeType === 'buy' ? styles.buyActive : ''}`}
                                onClick={() => setTradeType('buy')}
                            >
                                BUY
                            </button>
                            <button
                                type="button"
                                className={`${styles.tradeTypeBtn} ${tradeType === 'sell' ? styles.sellActive : ''}`}
                                onClick={() => setTradeType('sell')}
                            >
                                SELL
                            </button>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Amount ({selectedAsset?.symbol.replace('USDT', '')})</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.0001"
                                min="0"
                                className={styles.formInput}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Price (USDT)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                step="0.0001"
                                min="0"
                                className={styles.formInput}
                                required
                            />
                        </div>

                        {amount && price && (
                            <div className={styles.orderSummary}>
                                <div className={styles.summaryRow}>
                                    <span>Total:</span>
                                    <span>{formatPrice(parseFloat(amount) * parseFloat(price))}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Fee:</span>
                                    <span>{formatPrice((parseFloat(amount) * parseFloat(price)) * 0.001)}</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`${styles.placeOrderBtn} ${tradeType === 'buy' ? styles.buyBtn : styles.sellBtn}`}
                            disabled={!amount || !price || parseFloat(amount) <= 0 || parseFloat(price) <= 0}
                        >
                            {tradeType === 'buy' ? 'BUY' : 'SELL'} {selectedAsset?.symbol.replace('USDT', '')}
                        </button>
                    </form>

                    {/* Portfolio Overview */}
                    <div className={styles.portfolioOverview}>
                        <div className={styles.portfolioTotal}>
                            <span className={styles.totalLabel}>Total Value</span>
                            <span className={styles.totalAmount}>{formatPrice(portfolioValue)}</span>
                        </div>
                        <div className={styles.portfolioBreakdown}>
                            <div className={styles.breakdownItem}>
                                <span>USDT</span>
                                <span>{formatPrice(wallet.usdt)}</span>
                            </div>
                            {Object.entries(wallet.assets).slice(0, 3).map(([assetSymbol, asset]) => {
                                const currentAsset = assets.find(a => a.symbol === assetSymbol);
                                const currentPrice = currentAsset?.price || asset.avgPrice;
                                const pnl = currentPrice && asset.avgPrice ?
                                    ((currentPrice - asset.avgPrice) / asset.avgPrice) * 100 : 0;

                                return (
                                    <div key={assetSymbol} className={styles.breakdownItem}>
                                        <span>{assetSymbol.replace('USDT', '')}</span>
                                        <div className={styles.assetDetails}>
                                            <span>{asset.amount.toFixed(4)}</span>
                                            <span className={pnl >= 0 ? styles.positive : styles.negative}>
                                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className={styles.recentOrders}>
                        <h4 className={styles.sectionTitle}>Recent Orders</h4>
                        <div className={styles.ordersList}>
                            {orderHistory.slice(0, 3).map((order) => (
                                <div key={order.id} className={styles.orderItem}>
                                    <div className={styles.orderHeader}>
                                        <span className={`${styles.orderType} ${order.type === 'buy' ? styles.buyOrder : styles.sellOrder}`}>
                                            {order.type.toUpperCase()}
                                        </span>
                                        <span className={styles.orderSymbol}>
                                            {order.symbol.replace('USDT', '')}
                                        </span>
                                    </div>
                                    <div className={styles.orderDetails}>
                                        <span>{order.amount.toFixed(4)} @ {formatPrice(order.price)}</span>
                                        <span className={styles.orderTotal}>
                                            {formatPrice(order.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trade Panel Overlay */}
            {isTradePanelOpen && (
                <div
                    className={styles.tradePanelOverlay}
                    onClick={() => setIsTradePanelOpen(false)}
                />
            )}
        </div>
    );
};

export default Trading;