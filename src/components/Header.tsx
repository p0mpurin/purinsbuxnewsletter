'use client';

import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

export function Header() {
  const { lang, setLang, theme, setTheme, data, readerMode, setReaderMode } = useNewsletter();

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-stone-900 shadow-sm border-b border-stone-200 dark:border-stone-800 print:hidden">
      <div className="h-0.5 bg-gradient-to-r from-teal-500 to-teal-700 dark:from-teal-400 dark:to-teal-800" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 order-1 sm:order-none">
          <h1 className="text-lg sm:text-xl font-bold text-teal-700 dark:text-teal-400 tracking-tight">
            {t(lang, 'site_title')}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
            {t(lang, 'site_tagline')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm flex-wrap order-2 sm:order-none">
          <button
            type="button"
            onClick={() => setReaderMode(!readerMode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              readerMode
                ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {t(lang, 'reader_mode')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-600 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
            aria-label={t(lang, 'print_pdf')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-600 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
            aria-label={theme === 'dark' ? t(lang, 'theme_dark') : t(lang, 'theme_light')}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <nav className="flex rounded-lg overflow-hidden border border-stone-200 dark:border-stone-600" aria-label="Language">
            <button
              type="button"
              onClick={() => setLang('it')}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                lang === 'it' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              aria-pressed={lang === 'it'}
            >
              IT
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                lang === 'en' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
          </nav>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 shrink-0">
            {data?.week ? `${t(lang, 'week')} ${data.week}` : '—'}
          </span>
        </div>
      </div>
    </header>
  );
}
