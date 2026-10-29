// Product catalogue + purchase options. Prices are always computed on the server.
export const PRODUCTS = [
  { slug: 'ultimate-trader', pair: 'USD/JPY', timeframe: 60, winRate: 90.83, maxDrawdown: 29.66, profitFactor: 1.29, payoffRatio: 1.25, totalPips: 4676.4, price: 50000 },
  { slug: 'fx-sniper', pair: 'EUR/JPY', timeframe: 15, winRate: 98.51, maxDrawdown: null, profitFactor: 6667.75, payoffRatio: 104.89, totalPips: 299.96, price: 100000 },
  { slug: 'silver-fox', pair: 'NZD/JPY', timeframe: 30, winRate: 84.4, maxDrawdown: null, profitFactor: 1.73, payoffRatio: 0.96, totalPips: 14314.9, price: 200000 },
  { slug: 'infinity-z', pair: 'EUR/USD', timeframe: 5, winRate: 88.1, maxDrawdown: 67.89, profitFactor: 6.48, payoffRatio: 0.88, totalPips: 1382.48, price: 300000 },
  { slug: 'scalping-master', pair: 'USD/JPY', timeframe: 5, winRate: 85.44, maxDrawdown: 213.23, profitFactor: 3.41, payoffRatio: 0.58, totalPips: 10930.65, price: 500000 },
  { slug: 'gold-rush-system', pair: 'EUR/JPY', timeframe: 5, winRate: 82.14, maxDrawdown: 255.65, profitFactor: 0.65, payoffRatio: 0.14, totalPips: -130.1, price: 1000000 },
];

export const OPTIONS = [
  { id: 'chat3', price: 25000 },
  { id: 'chat10', price: 50000 },
  { id: 'upgrade', price: 50000 },
  { id: 'vps', price: 30000 },
];

export const findProduct = (slug) => PRODUCTS.find((p) => p.slug === slug);
