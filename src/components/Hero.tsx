'use client';

import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
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
    <section className="rounded-2xl sm:rounded-xl border border-stone-200 dark:border-stone-700 bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-900/50 p-4 sm:p-6 mb-4 sm:mb-6">
      <p className="text-stone-600 dark:text-stone-400 text-base leading-relaxed max-w-2xl">
        {t(lang, 'hero_text')}
      </p>
      <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
          {sections === 1 ? `1 ${secLabel}` : `${sections} ${secLabel}`}
        </span>
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
          {items === 1 ? `1 ${itemLabel}` : `${items} ${itemLabel}`}
        </span>
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
          {high === 1 ? `1 ${t(lang, 'stat_high')}` : `${high} ${t(lang, 'stat_high')}`}
        </span>
      </div>
    </section>
  );
}
