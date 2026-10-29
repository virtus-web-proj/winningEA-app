import HeroCandles from './HeroCandles.jsx';

// Shared Winning EA page banner.
export default function PageHero({ title, align = 'center', compact = false }) {
  return (
    <section
      className={`relative isolate overflow-hidden bg-navy-800 pt-20 text-white md:pt-24 ${compact ? 'pb-10 md:pb-12' : 'pb-16 md:pb-24'}`}
      style={{ backgroundImage: 'linear-gradient(rgba(0,29,138,.55), rgba(0,5,63,.85)), url(/images/profile-header-bg.jpg), linear-gradient(120deg,#001d8a,#00053f)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <HeroCandles className="absolute inset-x-0 bottom-0 -z-10 h-full w-full opacity-[.16]" />
      <div className={`container-gs pt-8 md:pt-12 ${align === 'center' ? 'text-center' : ''}`}>
        <h1 className="font-display text-3xl font-bold !text-white md:text-5xl">{title}</h1>
      </div>
    </section>
  );
}
