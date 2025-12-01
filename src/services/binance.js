export class BinanceService {
    static async testConnection() {
        try {
            const response = await fetch('https://api.binance.com/api/v3/ping');
            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async getPrice(symbol) {
        try {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
            const data = await response.json();
            return { success: true, price: parseFloat(data.price) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async get24hrTicker(symbol) {
        try {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
            const data = await response.json();
            return {
                success: true,
                data: {
                    symbol: data.symbol,
                    price: parseFloat(data.lastPrice),
                    change: parseFloat(data.priceChange),
                    changePercent: parseFloat(data.priceChangePercent),
                    volume: parseFloat(data.volume)
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async getMultipleTickers(symbols) {
        try {
            const symbolString = symbols.map(s => `"${s}"`).join(',');
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolString}]`);
            const data = await response.json();

            return {
                success: true,
                data: data.map(item => ({
                    symbol: item.symbol,
                    price: parseFloat(item.lastPrice),
                    change: parseFloat(item.priceChange),
                    changePercent: parseFloat(item.priceChangePercent),
                    volume: parseFloat(item.volume)
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async getAllUSDTPairs() {
        try {
            const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
            const allTickers = await response.json();

            // Filter only USDT pairs and major cryptocurrencies
            const usdtPairs = allTickers
                .filter(ticker => ticker.symbol.endsWith('USDT'))
                .filter(ticker => {
                    // Filter for major cryptocurrencies (you can expand this list)
                    const majorSymbols = [
                        'BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE',
                        'AVAX', 'LINK', 'MATIC', 'LTC', 'BCH', 'ATOM', 'ETC',
                        'XLM', 'FIL', 'THETA', 'EOS', 'XTZ', 'ALGO', 'AAVE',
                        'MKR', 'COMP', 'SNX', 'YFI', 'UNI', 'SUSHI', 'CRV'
                    ];
                    const baseSymbol = ticker.symbol.replace('USDT', '');
                    return majorSymbols.includes(baseSymbol);
                })
                .map(ticker => ({
                    symbol: ticker.symbol,
                    price: parseFloat(ticker.lastPrice),
                    change: parseFloat(ticker.priceChange),
                    changePercent: parseFloat(ticker.priceChangePercent),
                    volume: parseFloat(ticker.volume),
                    high: parseFloat(ticker.highPrice),
                    low: parseFloat(ticker.lowPrice)
                }))
                .sort((a, b) => b.volume - a.volume); // Sort by volume descending

            return { success: true, data: usdtPairs };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async getUSDTPrice(symbol) {
        // For mock trading - get current USDT price (should be ~$1)
        return { success: true, price: 1.0 };
    }

    static async getOrderBook(symbol, limit = 10) {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`);
      const data = await response.json();
      
      return {
        success: true,
        data: {
          bids: data.bids.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            total: parseFloat(price) * parseFloat(quantity)
          })),
          asks: data.asks.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            total: parseFloat(price) * parseFloat(quantity)
          }))
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getRecentTrades(symbol, limit = 10) {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=${limit}`);
      const data = await response.json();
      
      return {
        success: true,
        data: data.map(trade => ({
          id: trade.id,
          price: parseFloat(trade.price),
          quantity: parseFloat(trade.qty),
          time: new Date(trade.time),
          isBuyerMaker: trade.isBuyerMaker
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  static async getChartData(symbol, interval = '1h', limit = 24) {
    try {
        const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const formattedData = data.map(candle => ({
            openTime: candle[0],
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
            closeTime: candle[6],
            quoteVolume: parseFloat(candle[7]),
            trades: candle[8],
            takerBuyBaseVolume: parseFloat(candle[9]),
            takerBuyQuoteVolume: parseFloat(candle[10])
        }));
        
        return { success: true, data: formattedData };
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return { 
            success: false, 
            error: 'Failed to fetch chart data',
            data: [] 
        };
    }
}
}