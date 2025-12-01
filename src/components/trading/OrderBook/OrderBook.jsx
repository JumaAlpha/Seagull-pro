import React, { memo } from 'react';
import styles from './OrderBook.module.css';

const OrderBook = memo(({ bids = [], asks = [] }) => {
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(4);
  };

  const formatPrice = (price) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  return (
    <div className={styles.orderBook}>
      <div className={styles.orderBookHeader}>
        <h3 className={styles.title}>Order Book</h3>
        <div className={styles.legend}>
          <span>Price (USDT)</span>
          <span>Amount</span>
          <span>Total</span>
        </div>
      </div>
      
      <div className={styles.orderBookContent}>
        {/* Asks (Sell orders) */}
        <div className={styles.asks}>
          {asks.slice(0, 8).map((order, index) => (
            <div key={`ask-${index}-${order.price}`} className={styles.orderRow}>
              <span className={styles.askPrice}>{formatPrice(order.price)}</span>
              <span className={styles.quantity}>{formatNumber(order.quantity)}</span>
              <span className={styles.total}>{formatNumber(order.total)}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className={styles.spread}>
          <span className={styles.spreadLabel}>Spread</span>
          <span className={styles.spreadValue}>
            {asks[0] && bids[0] ? 
              `${((asks[0].price - bids[0].price) / bids[0].price * 100).toFixed(2)}%` 
              : '0.00%'
            }
          </span>
        </div>

        {/* Bids (Buy orders) */}
        <div className={styles.bids}>
          {bids.slice(0, 8).map((order, index) => (
            <div key={`bid-${index}-${order.price}`} className={styles.orderRow}>
              <span className={styles.bidPrice}>{formatPrice(order.price)}</span>
              <span className={styles.quantity}>{formatNumber(order.quantity)}</span>
              <span className={styles.total}>{formatNumber(order.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

OrderBook.displayName = 'OrderBook';

export default OrderBook;