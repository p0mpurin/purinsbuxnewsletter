'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';
import type { NewsletterData } from '@/lib/types';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

interface QuickBarProps {
  search: string;
  setSearch: (s: string) => void;
  filterPriority: string;
  setFilterPriority: (s: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenFilters: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

function countByPriority(data: NewsletterData | null, priority: string): number {
  if (!data?.sections) return 0;
  return data.sections.reduce(
    (acc, sec) => acc + (sec.items ?? []).filter((i) => i.priority === priority).length,
    0
  );
}

const PRIORITY_CHIPS = [
  {
    value: '',
    getLabel: (t: (k: TranslationKey) => string) => t('filter_all_priorities'),
    colorActive: 'text-white',
    activeStyle: { background: 'var(--brand)' } as React.CSSProperties,
    colorInactive: 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800',
    dot: '',
  },
  {
    value: 'HIGH',
    getLabel: (t: (k: TranslationKey) => string) => t('priority_high'),
    colorActive: 'bg-red-600 text-white dark:bg-red-700',
    activeStyle: undefined,
    colorInactive: 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400',
    dot: 'bg-red-500',
  },
  {
    value: 'MEDIUM',
    getLabel: (t: (k: TranslationKey) => string) => t('priority_medium'),
    colorActive: 'bg-amber-500 text-white',
    activeStyle: undefined,
    colorInactive: 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400',
    dot: 'bg-amber-400',
  },
  {
    value: 'LOW',
    getLabel: (t: (k: TranslationKey) => string) => t('priority_low'),
    colorActive: 'text-white',
    activeStyle: { background: 'var(--brand)' } as React.CSSProperties,
    colorInactive: 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400',
    dot: 'bg-emerald-500',
  },
] as const;

export function QuickBar({
  search,
  setSearch,
  filterPriority,
  setFilterPriority,
  onExpandAll,
  onCollapseAll,
  onOpenFilters,
  searchInputRef,
}: QuickBarProps) {
  const { lang, data } = useNewsletter();
  const [localSearch, setLocalSearch] = useState(search);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? localRef;

  useEffect(() => { setLocalSearch(search); }, [search]);

  const debouncedSetSearch = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout>;
    return (v: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setSearch(v), 80);
    };
  }, [setSearch]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setLocalSearch(v);
      debouncedSetSearch(v);
    },
    [debouncedSetSearch]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        (inputRef as React.RefObject<HTMLInputElement>)?.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [inputRef]);

  const counts = {
    HIGH: countByPriority(data, 'HIGH'),
    MEDIUM: countByPriority(data, 'MEDIUM'),
    LOW: countByPriority(data, 'LOW'),
  };

  return (
    <div className="flex flex-col gap-3 mb-5 sm:mb-6 print:hidden">
      {/* Search + action row */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          {/* Search icon */}
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="search"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder={t(lang, 'search_placeholder')}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700
                       bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm
                       placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
            style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
            aria-label={t(lang, 'search_label')}
          />
          {/* Keyboard shortcut hint */}
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-stone-300 dark:text-stone-600 hidden sm:block select-none border border-stone-200 dark:border-stone-700 px-1 rounded">
            /
          </span>
        </div>

        {/* Expand / collapse */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onExpandAll}
            title={t(lang, 'expand_all')}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900
                       text-stone-400 hover:text-[--brand] hover:border-[--brand] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            title={t(lang, 'collapse_all')}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900
                       text-stone-400 hover:text-[--brand] hover:border-[--brand] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onOpenFilters}
            title={t(lang, 'filters')}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900
                       text-stone-400 hover:text-[--brand] hover:border-[--brand] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Priority filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {PRIORITY_CHIPS.map((chip) => {
          const isActive = filterPriority === chip.value;
          const count = chip.value ? counts[chip.value as keyof typeof counts] : null;
          return (
            <button
              key={chip.value || 'all'}
              type="button"
              onClick={() => setFilterPriority(chip.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all touch-manipulation ${isActive
                  ? `${chip.colorActive} border-transparent shadow-sm`
                  : `${chip.colorInactive} border-stone-200 dark:border-stone-700`
                }`}
              style={isActive && chip.activeStyle ? chip.activeStyle : undefined}
            >
              {/* Priority dot for non-"All" chips */}
              {chip.dot && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white/80' : chip.dot}`} />
              )}
              {chip.getLabel((k) => t(lang, k))}
              {count != null && count > 0 && (
                <span className={`font-bold ${isActive ? 'opacity-80' : 'text-stone-400 dark:text-stone-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
