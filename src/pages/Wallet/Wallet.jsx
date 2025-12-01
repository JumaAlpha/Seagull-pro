// pages/Wallet/Wallet.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletService } from '../../services/wallet';
import { BinanceService } from '../../services/binance';
import styles from './Wallet.module.css';

const Wallet = () => {
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(WalletService.getWallet());
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [transactionHistory, setTransactionHistory] = useState([]);

    // Calculate portfolio value and performance
    const portfolioData = useMemo(() => {
        if (!assets.length) return { totalValue: 0, assets: [] };

        let totalValue = wallet.usdt;
        const assetsWithValue = [];

        Object.entries(wallet.assets).forEach(([symbol, asset]) => {
            const marketData = assets.find(a => a.symbol === symbol);
            const currentPrice = marketData?.price || asset.avgPrice;
            const currentValue = asset.amount * currentPrice;
            const pnl = currentPrice && asset.avgPrice ? 
                ((currentPrice - asset.avgPrice) / asset.avgPrice) * 100 : 0;
            const pnlValue = currentValue - (asset.amount * asset.avgPrice);

            totalValue += currentValue;

            assetsWithValue.push({
                symbol,
                amount: asset.amount,
                avgPrice: asset.avgPrice,
                currentPrice,
                currentValue,
                pnl,
                pnlValue,
                change24h: marketData?.changePercent || 0
            });
        });

        // Sort by current value (highest first)
        assetsWithValue.sort((a, b) => b.currentValue - a.currentValue);

        return {
            totalValue,
            assets: assetsWithValue,
            totalPnl: assetsWithValue.reduce((sum, asset) => sum + asset.pnlValue, 0),
            totalPnlPercent: totalValue > 0 ? (assetsWithValue.reduce((sum, asset) => sum + asset.pnlValue, 0) / (totalValue - assetsWithValue.reduce((sum, asset) => sum + asset.pnlValue, 0))) * 100 : 0
        };
    }, [wallet, assets]);

    // Load market data
    useEffect(() => {
        const loadMarketData = async () => {
            try {
                const result = await BinanceService.getAllUSDTPairs();
                if (result.success) {
                    setAssets(result.data);
                }
            } catch (error) {
                console.error('Error loading market data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMarketData();
    }, []);

    // Load transaction history from localStorage
    useEffect(() => {
        const storedHistory = localStorage.getItem('Seagull-Pro_transaction_history');
        if (storedHistory) {
            setTransactionHistory(JSON.parse(storedHistory));
        }
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(price);
    };

    const formatPercentage = (value) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    const getPnlColor = (value) => {
        return value >= 0 ? styles.positive : styles.negative;
    };

    const handleDeposit = () => {
        const amount = parseFloat(prompt('Enter deposit amount (USDT):'));
        if (amount && amount > 0) {
            const newWallet = { ...wallet, usdt: wallet.usdt + amount };
            setWallet(newWallet);
            WalletService.saveWallet(newWallet);

            // Record transaction
            const transaction = {
                id: Date.now(),
                type: 'deposit',
                amount,
                currency: 'USDT',
                timestamp: new Date(),
                status: 'completed'
            };
            addTransaction(transaction);
        }
    };

    const handleWithdraw = () => {
        const amount = parseFloat(prompt('Enter withdrawal amount (USDT):'));
        if (amount && amount > 0) {
            if (amount > wallet.usdt) {
                alert('Insufficient balance');
                return;
            }
            const newWallet = { ...wallet, usdt: wallet.usdt - amount };
            setWallet(newWallet);
            WalletService.saveWallet(newWallet);

            // Record transaction
            const transaction = {
                id: Date.now(),
                type: 'withdrawal',
                amount,
                currency: 'USDT',
                timestamp: new Date(),
                status: 'completed'
            };
            addTransaction(transaction);
        }
    };

    const addTransaction = (transaction) => {
        const newHistory = [transaction, ...transactionHistory.slice(0, 49)]; // Keep last 50 transactions
        setTransactionHistory(newHistory);
        localStorage.setItem('Seagull-Pro_transaction_history', JSON.stringify(newHistory));
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading wallet data...</p>
            </div>
        );
    }

    return (
        <div className={styles.walletPage}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <span className={styles.logoIcon}>💰</span>
                    <h1 className={styles.brandName}>My Wallet</h1>
                </div>
                <div className={styles.headerActions}>
                    <button 
                        className={styles.navButton}
                        onClick={() => navigate('/trading/BTCUSDT')}
                    >
                        ← Trading
                    </button>
                </div>
            </header>

            {/* Portfolio Overview */}
            <div className={styles.portfolioSection}>
                <div className={styles.portfolioCard}>
                    <div className={styles.portfolioHeader}>
                        <h2>Portfolio Value</h2>
                        <div className={styles.portfolioActions}>
                            <button 
                                className={styles.actionButton}
                                onClick={handleDeposit}
                            >
                                Deposit
                            </button>
                            <button 
                                className={styles.actionButton}
                                onClick={handleWithdraw}
                            >
                                Withdraw
                            </button>
                        </div>
                    </div>
                    
                    <div className={styles.portfolioValue}>
                        <span className={styles.totalValue}>
                            {formatPrice(portfolioData.totalValue)}
                        </span>
                        <div className={styles.pnlSection}>
                            <span className={`${styles.pnlValue} ${getPnlColor(portfolioData.totalPnl)}`}>
                                {formatPrice(portfolioData.totalPnl)}
                            </span>
                            <span className={`${styles.pnlPercent} ${getPnlColor(portfolioData.totalPnl)}`}>
                                {formatPercentage(portfolioData.totalPnlPercent)}
                            </span>
                        </div>
                    </div>

                    <div className={styles.balanceBreakdown}>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceLabel}>Available USDT</span>
                            <span className={styles.balanceAmount}>{formatPrice(wallet.usdt)}</span>
                        </div>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceLabel}>Invested in Assets</span>
                            <span className={styles.balanceAmount}>
                                {formatPrice(portfolioData.totalValue - wallet.usdt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabNavigation}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Assets Overview
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'transactions' ? styles.active : ''}`}
                    onClick={() => setActiveTab('transactions')}
                >
                    Transaction History
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'performance' ? styles.active : ''}`}
                    onClick={() => setActiveTab('performance')}
                >
                    Performance
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                    <div className={styles.assetsOverview}>
                        <h3>Your Assets</h3>
                        {portfolioData.assets.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No assets yet. Start trading to build your portfolio!</p>
                                <button 
                                    className={styles.ctaButton}
                                    onClick={() => navigate('/trading/BTCUSDT')}
                                >
                                    Start Trading
                                </button>
                            </div>
                        ) : (
                            <div className={styles.assetsTable}>
                                <div className={styles.tableHeader}>
                                    <span>Asset</span>
                                    <span>Holdings</span>
                                    <span>Avg. Price</span>
                                    <span>Current Price</span>
                                    <span>Value</span>
                                    <span>PNL</span>
                                    <span>24h Change</span>
                                </div>
                                {portfolioData.assets.map((asset) => (
                                    <div 
                                        key={asset.symbol} 
                                        className={styles.assetRow}
                                        onClick={() => navigate(`/trading/${asset.symbol}`)}
                                    >
                                        <span className={styles.assetName}>
                                            {asset.symbol.replace('USDT', '')}
                                        </span>
                                        <span className={styles.assetAmount}>
                                            {asset.amount.toFixed(6)}
                                        </span>
                                        <span className={styles.assetPrice}>
                                            {formatPrice(asset.avgPrice)}
                                        </span>
                                        <span className={styles.assetPrice}>
                                            {formatPrice(asset.currentPrice)}
                                        </span>
                                        <span className={styles.assetValue}>
                                            {formatPrice(asset.currentValue)}
                                        </span>
                                        <div className={styles.pnlColumn}>
                                            <span className={`${styles.pnlValue} ${getPnlColor(asset.pnlValue)}`}>
                                                {formatPrice(asset.pnlValue)}
                                            </span>
                                            <span className={`${styles.pnlPercent} ${getPnlColor(asset.pnl)}`}>
                                                {formatPercentage(asset.pnl)}
                                            </span>
                                        </div>
                                        <span className={`${styles.change24h} ${getPnlColor(asset.change24h)}`}>
                                            {formatPercentage(asset.change24h)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className={styles.transactionsHistory}>
                        <h3>Transaction History</h3>
                        {transactionHistory.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No transactions yet.</p>
                            </div>
                        ) : (
                            <div className={styles.transactionsTable}>
                                <div className={styles.tableHeader}>
                                    <span>Type</span>
                                    <span>Amount</span>
                                    <span>Currency</span>
                                    <span>Date</span>
                                    <span>Status</span>
                                </div>
                                {transactionHistory.map((transaction) => (
                                    <div key={transaction.id} className={styles.transactionRow}>
                                        <span className={`${styles.txType} ${styles[transaction.type]}`}>
                                            {transaction.type.toUpperCase()}
                                        </span>
                                        <span className={styles.txAmount}>
                                            {formatPrice(transaction.amount)}
                                        </span>
                                        <span className={styles.txCurrency}>
                                            {transaction.currency}
                                        </span>
                                        <span className={styles.txDate}>
                                            {new Date(transaction.timestamp).toLocaleString()}
                                        </span>
                                        <span className={`${styles.txStatus} ${styles[transaction.status]}`}>
                                            {transaction.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className={styles.performanceView}>
                        <h3>Portfolio Performance</h3>
                        <div className={styles.performanceMetrics}>
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>Total Return</span>
                                <span className={`${styles.metricValue} ${getPnlColor(portfolioData.totalPnl)}`}>
                                    {formatPrice(portfolioData.totalPnl)}
                                </span>
                                <span className={`${styles.metricChange} ${getPnlColor(portfolioData.totalPnlPercent)}`}>
                                    {formatPercentage(portfolioData.totalPnlPercent)}
                                </span>
                            </div>
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>Total Assets</span>
                                <span className={styles.metricValue}>
                                    {portfolioData.assets.length}
                                </span>
                                <span className={styles.metricChange}>Holdings</span>
                            </div>
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>Available Balance</span>
                                <span className={styles.metricValue}>
                                    {formatPrice(wallet.usdt)}
                                </span>
                                <span className={styles.metricChange}>Ready to trade</span>
                            </div>
                        </div>
                        
                        {/* Asset Allocation Chart Placeholder */}
                        <div className={styles.allocationSection}>
                            <h4>Asset Allocation</h4>
                            <div className={styles.allocationChart}>
                                {portfolioData.assets.map((asset, index) => {
                                    const percentage = (asset.currentValue / portfolioData.totalValue) * 100;
                                    return (
                                        <div 
                                            key={asset.symbol}
                                            className={styles.allocationItem}
                                            style={{ 
                                                width: `${percentage}%`,
                                                backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                                            }}
                                        >
                                            <span className={styles.allocationLabel}>
                                                {asset.symbol.replace('USDT', '')} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                    );
                                })}
                                {wallet.usdt > 0 && (
                                    <div 
                                        className={styles.allocationItem}
                                        style={{ 
                                            width: `${(wallet.usdt / portfolioData.totalValue) * 100}%`,
                                            backgroundColor: '#10b981'
                                        }}
                                    >
                                        <span className={styles.allocationLabel}>
                                            USDT ({((wallet.usdt / portfolioData.totalValue) * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallet;