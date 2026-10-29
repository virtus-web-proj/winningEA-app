import { useTranslation } from 'react-i18next';
import PageHero from '../components/PageHero.jsx';

export default function Terms() {
  const { t } = useTranslation();
  const articles = t('terms.articles', { returnObjects: true });
  return (
    <>
      <PageHero title={t('terms.title')} align="left" />
      <section className="container-gs max-w-3xl space-y-12 py-14 md:py-20">
        {articles.map((a) => {
          const subAt = a.sub ? (a.subAt ?? (a.list?.length ?? 1) - 1) : -1;
          return (
            <article key={a.h}>
              <h2 className="text-center text-xl font-bold md:text-2xl">{a.h}</h2>
              {a.lead && <p className="mt-5 text-[13px] leading-7">{a.lead}</p>}
              {a.list && (
                <ol className="mt-3 list-decimal space-y-1 pl-6 text-[13px] leading-7 marker:text-slate-400">
                  {a.list.map((item, i) => (
                    <li key={i}>
                      {item}
                      {i === subAt && <ul className="mt-1 space-y-0.5 pl-0">{a.sub.map((s) => <li key={s} className="list-none">{s}</li>)}</ul>}
                    </li>
                  ))}
                </ol>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}
