'use client';

import { useEffect, useState } from 'react';
import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="h-0.5 w-full bg-stone-200 dark:bg-stone-800 relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full transition-[width] duration-75 ease-linear"
        style={{ width: `${progress}%`, background: 'var(--brand)' }}
      />
    </div>
  );
}

export function Header() {
  const { lang, setLang, theme, setTheme, data, readerMode, setReaderMode } = useNewsletter();

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md shadow-sm border-b border-stone-200/80 dark:border-stone-800 print:hidden">
      {/* Top brand accent bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--brand-dark), var(--brand), #CBA258)' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Logo + title */}
        <div className="min-w-0 order-1 sm:order-none flex items-center gap-2.5">
          {/* Starbucks star icon */}
          {/* Starbucks-inspired SVG logo mark */}
          <svg width="32" height="32" viewBox="0 0 100 100" className="shrink-0" aria-hidden="true">
            <circle cx="50" cy="50" r="50" fill="var(--brand)" />
            {/* Star / siren silhouette using lines */}
            <circle cx="50" cy="50" r="22" fill="none" stroke="white" strokeWidth="4" />
            <circle cx="50" cy="50" r="8" fill="white" />
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <line
                key={i}
                x1="50" y1="50"
                x2={50 + 30 * Math.cos((deg - 90) * Math.PI / 180)}
                y2={50 + 30 * Math.sin((deg - 90) * Math.PI / 180)}
                stroke="white" strokeWidth="3.5" strokeLinecap="round"
              />
            ))}
          </svg>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: 'var(--brand)' }}>
              {t(lang, 'site_title')}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate leading-tight">
              {t(lang, 'site_tagline')}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-sm flex-wrap order-2 sm:order-none">
          {/* Reader mode */}
          <button
            type="button"
            onClick={() => setReaderMode(!readerMode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${readerMode
              ? 'text-white shadow-sm'
              : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            style={readerMode ? { background: 'var(--brand)' } : {}}
          >
            {t(lang, 'reader_mode')}
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            aria-label={t(lang, 'print_pdf')}
            style={{ '--tw-border-color': 'var(--brand)' } as React.CSSProperties}
          >
            <svg className="w-4 h-4 text-stone-500 dark:text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            aria-label={theme === 'dark' ? t(lang, 'theme_dark') : t(lang, 'theme_light')}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Language switcher */}
          <nav className="flex rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700" aria-label="Language">
            {(['it', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${lang === l
                  ? 'text-white'
                  : 'bg-white dark:bg-stone-900 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                style={lang === l ? { background: 'var(--brand)' } : {}}
                aria-pressed={lang === l}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </nav>

          {/* Week badge */}
          {data?.week && (
            <span
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white shrink-0 tabular-nums"
              style={{ background: 'var(--brand)' }}
            >
              Wk {data.week}
            </span>
          )}
        </div>
      </div>

      {/* Scroll progress bar */}
      <ScrollProgressBar />
    </header>
  );
}
