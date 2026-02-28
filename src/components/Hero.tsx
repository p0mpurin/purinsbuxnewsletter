'use client';

import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

function StatPill({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-stone-200/70 dark:border-stone-700/50 bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm">
      <span className="text-stone-400 dark:text-stone-500 shrink-0">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: accent ?? 'var(--brand)' }}
        >
          {value}
        </span>
        <span className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
}

export function Hero() {
  const { lang, data } = useNewsletter();

  if (!data?.sections) return null;

  const sections = data.sections.length;
  let items = 0;
  let high = 0;
  data.sections.forEach((sec) => {
    const list = sec.items || [];
    items += list.length;
    list.forEach((i) => {
      if (i.priority === 'HIGH') high++;
    });
  });

  const secLabel = sections === 1 ? t(lang, 'stat_section') : t(lang, 'stat_sections');
  const itemLabel = items === 1 ? t(lang, 'stat_item') : t(lang, 'stat_items');

  return (
    <section
      className="rounded-2xl border border-[#00704A1a] p-5 sm:p-7 mb-5 sm:mb-7 overflow-hidden relative
                 bg-gradient-to-br from-[#f0faf5] via-[#e8f5e9] to-[#faf8f4]
                 dark:from-[#0d2b1f] dark:via-[#0a1f16] dark:to-[#131008]"
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.07]" style={{ background: 'var(--brand)' }} />
      <div className="pointer-events-none absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-[0.05]" style={{ background: 'var(--brand)' }} />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex-1 min-w-0">
          {data.week && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-3" style={{ background: 'var(--brand)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Week {data.week}
            </div>
          )}
          <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed max-w-2xl">
            {t(lang, 'hero_text')}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <StatPill
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            }
            value={sections}
            label={secLabel}
          />
          <StatPill
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            }
            value={items}
            label={itemLabel}
          />
          {high > 0 && (
            <StatPill
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              value={high}
              label={t(lang, 'stat_high')}
              accent="#dc2626"
            />
          )}
        </div>
      </div>
    </section>
  );
}
