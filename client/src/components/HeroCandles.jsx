// Decorative animated candlestick chart used behind the hero headline.
const candles = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let y = 62;
  return Array.from({ length: 34 }, (_, i) => {
    const drift = (rnd() - 0.46) * 12;
    const open = y;
    y = Math.max(18, Math.min(84, y - drift));
    const close = y;
    return { i, open, close, hi: Math.min(open, close) - rnd() * 8, lo: Math.max(open, close) + rnd() * 8, up: close < open };
  });
})();

export default function HeroCandles({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 340 100" preserveAspectRatio="none" aria-hidden="true">
      {candles.map((c) => {
        const x = c.i * 10 + 4;
        const top = Math.min(c.open, c.close);
        const h = Math.max(2, Math.abs(c.open - c.close));
        const col = c.up ? '#6cc4f0' : '#0693e3';
        return (
          <g key={c.i} className="candle" style={{ '--d': `${3.2 + (c.i % 5) * 0.55}s`, '--delay': `${(c.i % 7) * -0.4}s` }}>
            <line x1={x + 2.5} x2={x + 2.5} y1={c.hi} y2={c.lo} stroke={col} strokeWidth="0.7" opacity=".7" />
            <rect x={x} y={top} width="5" height={h} rx="0.6" fill={col} opacity={c.up ? 0.85 : 0.5} />
          </g>
        );
      })}
    </svg>
  );
}
