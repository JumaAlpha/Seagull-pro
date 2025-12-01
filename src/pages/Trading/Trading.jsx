import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Trading.module.css';
import { BinanceService } from '../../services/binance';
import { WalletService } from '../../services/wallet';
import TradingChart from '../../components/trading/TradingChart/TradingChart';
import OrderBook from '../../components/trading/OrderBook/OrderBook';
import MiniChart from '../../components/trading/MiniChart/MiniChart'; // You'll need to create this

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
    const [chartData, setChartData] = useState([]); // For mini chart

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

    // Data fetching
    const fetchMarketData = useCallback(async () => {
        try {
            const result = await BinanceService.getAllUSDTPairs();
            if (result.success) {
                setAssets(result.data);
                const currentPrices = {};
                result.data.forEach(asset => {
                    currentPrices[asset.symbol] = asset.price;
                });
                setPortfolioValue(WalletService.getPortfolioValue(currentPrices));
            }
        } catch (error) {
            console.error('Error fetching market data:', error);
        }
    }, []);

    const fetchRealTimeData = useCallback(async (currentSymbol) => {
        if (!currentSymbol) return;

        try {
            setIsLoadingOrderBook(true);
            const [orderBookResult, tradesResult, chartResult] = await Promise.all([
                BinanceService.getOrderBook(currentSymbol, 20),
                BinanceService.getRecentTrades(currentSymbol, 10),
                BinanceService.getChartData(currentSymbol, '1h', 24) // Fetch 24h data for mini chart
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
        }
    }, [selectedAsset]);

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

            const currentPrices = {};
            assets.forEach(asset => {
                currentPrices[asset.symbol] = asset.price;
            });
            setPortfolioValue(WalletService.getPortfolioValue(currentPrices));

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
            alert(`${tradeType.toUpperCase()} order executed: ${tradeAmount} ${selectedAsset.symbol.replace('USDT', '')} at $${tradePrice}`);

        } catch (error) {
            alert(`Trade failed: ${error.message}`);
        }
    }, [amount, price, selectedAsset, tradeType, assets]);

    // Utility functions
    const getAssetBalance = useCallback((assetSymbol) => {
        return WalletService.getAssetBalance(assetSymbol);
    }, []);

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

    const getChangeColor = (change) => change >= 0 ? styles.positive : styles.negative;

    if (loading && assets.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading trading data...</p>
            </div>
        );
    }

    return (
        <div className={styles.tradingPage}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        ☰
                    </button>
                    <div className={styles.brand}>
                        <span className={styles.logoIcon}>⚡</span>
                        <h1 className={styles.brandName}>Seagull-Pro</h1>
                    </div>
                </div>

                <div className={styles.headerCenter}>
                    {selectedAsset && (
                        <div className={styles.symbolInfo}>
                            <span className={styles.symbolName}>
                                {selectedAsset.symbol.replace('USDT', '')}/USDT
                            </span>
                            <span className={styles.currentPrice}>
                                {formatPrice(selectedAsset.price)}
                            </span>
                            <span className={`${styles.priceChange} ${getChangeColor(selectedAsset.change)}`}>
                                {selectedAsset.changePercent >= 0 ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.headerRight}>
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

                    <div className={styles.headerBalances}>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceAmount}>{formatPrice(portfolioValue)}</span>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button
                            className={styles.tradeButton}
                            onClick={() => setIsTradePanelOpen(true)}
                        >
                            📈 Trade
                        </button>
                        <button className={styles.headerBtn} onClick={() => navigate('/wallet')}>
                            💰
                        </button>
                        <button className={styles.headerBtn} onClick={() => navigate('/dashboard')}>
                            📊
                        </button>
                    </div>
                </div>
            </header>

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
                    <div className={styles.chartContainer}>
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
                    {/* Floating Mini Chart - Desktop only */}
                    
                    <div className={styles.floatingChart}>
                        <MiniChart
                            symbol={symbol}
                            interval="1m"
                            limit={24}
                            height={120}
                        />
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