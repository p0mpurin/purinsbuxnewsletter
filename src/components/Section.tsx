'use client';

import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';
import { ItemCard } from './ItemCard';
import type { Section as SectionType, NewsletterItem } from '@/lib/types';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

interface SectionProps {
  section: SectionType;
  index: number;
  visibleCount: number;
  isOpen: boolean;
  onToggle: () => void;
  itemMatches: (item: NewsletterItem) => boolean;
  searchQuery?: string;
  isRead?: (item: NewsletterItem) => boolean;
  onToggleRead?: (item: NewsletterItem) => void;
}

export function Section({
  section,
  index,
  visibleCount,
  isOpen,
  onToggle,
  itemMatches,
  searchQuery,
  isRead,
  onToggleRead,
}: SectionProps) {
  const { lang } = useNewsletter();
  const totalVisible = (section.items ?? []).filter(itemMatches).length;
  const readTotal = isRead ? (section.items ?? []).filter((i) => itemMatches(i) && isRead(i)).length : 0;

  const countLabel =
    section.items.length === 1
      ? `1 ${t(lang, 'stat_item')}`
      : `${section.items.length} ${t(lang, 'stat_items')}`;

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-stone-950 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${visibleCount === 0 ? 'hidden' : ''
        }`}
      style={{ borderColor: 'var(--card-border, #e5ded5)' }}
      id={`section-${index}`}
      data-section-id={`section-${index}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-inset touch-manipulation"
        style={
          {
            '--tw-ring-color': 'var(--brand)',
            background: isOpen ? 'linear-gradient(90deg, #00704A08, transparent)' : undefined,
          } as React.CSSProperties
        }
        aria-expanded={isOpen}
        aria-controls={`section-${index}-body`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Left green accent bar */}
          <div
            className="shrink-0 w-1 h-8 rounded-full transition-all"
            style={{ background: isOpen ? 'var(--brand)' : '#00704A33' }}
          />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 leading-tight">
              {section.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-stone-400 dark:text-stone-500">{countLabel}</span>
              {/* Read progress */}
              {isRead && totalVisible > 0 && (
                <span className={`text-xs font-medium ${readTotal === totalVisible ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'}`}>
                  · {readTotal}/{totalVisible} read
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${isOpen ? 'rotate-180 text-white' : 'text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800'
            }`}
          style={isOpen ? { background: 'var(--brand)' } : {}}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      <div
        id={`section-${index}-body`}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
      >
        <div className="overflow-hidden">
          <div
            className="px-4 sm:px-5 pb-5 pt-0"
            style={{ borderTop: '1px solid var(--card-border, #e5ded5)' }}
          >
            <div className="space-y-3 mt-3">
              {section.items.map((item, i) => (
                <ItemCard
                  key={i}
                  item={item}
                  sectionTitle={section.title}
                  visible={itemMatches(item)}
                  searchQuery={searchQuery}
                  isRead={isRead ? isRead(item) : false}
                  onToggleRead={onToggleRead ? () => onToggleRead(item) : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
