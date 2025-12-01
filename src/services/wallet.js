export class WalletService {
  static STORAGE_KEY = 'Seagull-Pro_wallet';

  static getWallet() {
    if (typeof window === 'undefined') return { usdt: 10000, assets: {} };
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default wallet with 10,000 USDT
    const defaultWallet = {
      usdt: 10000,
      assets: {}
    };
    
    this.saveWallet(defaultWallet);
    return defaultWallet;
  }

  static saveWallet(wallet) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(wallet));
    }
  }

  static buyAsset(symbol, amount, price) {
    const wallet = this.getWallet();
    const totalCost = amount * price;
    
    if (wallet.usdt < totalCost) {
      throw new Error('Insufficient USDT balance');
    }

    // Update USDT balance
    wallet.usdt -= totalCost;
    
    // Update asset balance
    if (!wallet.assets[symbol]) {
      wallet.assets[symbol] = { amount: 0, avgPrice: 0 };
    }
    
    const asset = wallet.assets[symbol];
    const totalValue = (asset.amount * asset.avgPrice) + totalCost;
    const totalAmount = asset.amount + amount;
    
    asset.amount = totalAmount;
    asset.avgPrice = totalValue / totalAmount;
    
    this.saveWallet(wallet);
    return wallet;
  }

  static sellAsset(symbol, amount, price) {
    const wallet = this.getWallet();
    
    if (!wallet.assets[symbol] || wallet.assets[symbol].amount < amount) {
      throw new Error('Insufficient asset balance');
    }

    const asset = wallet.assets[symbol];
    const totalRevenue = amount * price;
    
    // Update USDT balance
    wallet.usdt += totalRevenue;
    
    // Update asset balance
    asset.amount -= amount;
    
    // Remove asset if balance is zero
    if (asset.amount === 0) {
      delete wallet.assets[symbol];
    }
    
    this.saveWallet(wallet);
    return wallet;
  }

  static getPortfolioValue(currentPrices = {}) {
    const wallet = this.getWallet();
    let totalValue = wallet.usdt;
    
    Object.entries(wallet.assets).forEach(([symbol, asset]) => {
      const currentPrice = currentPrices[symbol] || asset.avgPrice;
      totalValue += asset.amount * currentPrice;
    });
    
    return totalValue;
  }

  static getAssetBalance(symbol) {
    const wallet = this.getWallet();
    return wallet.assets[symbol]?.amount || 0;
  }
}
