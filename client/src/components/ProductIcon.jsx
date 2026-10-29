import { useState } from 'react';
import { BarChart3, ChartColumn, ChartLine, PieChart, Coins, Smartphone } from 'lucide-react';

const FALLBACK = {
  'ultimate-trader': BarChart3,
  'fx-sniper': ChartColumn,
  'silver-fox': ChartLine,
  'infinity-z': PieChart,
  'scalping-master': Coins,
  'gold-rush-system': Smartphone,
};

const PRODUCT_IMAGES = {
  'ultimate-trader': 'ultimate-trader.jpg',
  'fx-sniper': 'fx-sniper.jpg',
  'silver-fox': 'silver-fox.jpg',
  'infinity-z': 'infinity-z.jpg',
  'scalping-master': 'scalping-master.jpg',
  'gold-rush-system': 'gold-rush-system.jpg',
};

// Shows the supplied Winning EA product artwork, otherwise a line icon.
export default function ProductIcon({ slug, size = 72, className = '' }) {
  const [failed, setFailed] = useState(false);
  const Icon = FALLBACK[slug] || BarChart3;
  if (failed) return <Icon className={`text-navy-900 ${className}`} style={{ width: size * 0.8, height: size * 0.8 }} strokeWidth={1.4} />;
  return <img src={`/images/products/${PRODUCT_IMAGES[slug] || `${slug}.png`}`} alt="" width={size} height={size} className={className} onError={() => setFailed(true)} />;
}
