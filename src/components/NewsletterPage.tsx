'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';
import { normalizeText } from '@/lib/utils';
import { useReadState, useNewWeekBadge } from '@/lib/useNewsletterState';
import { Header } from './Header';
import { Hero } from './Hero';
import { QuickBar } from './QuickBar';
import { FilterDrawer } from './FilterDrawer';
import { SectionNav } from './SectionNav';
import { Section } from './Section';
import type { NewsletterData, NewsletterItem } from '@/lib/types';

function t(lang: 'it' | 'en', key: TranslationKey) {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

const STORAGE_KEY = 'partner-newsletter-filters';

export function NewsletterPage() {
  const { data, setData, lang, setError, setLoading, loading, error } = useNewsletter();

  const { isRead, toggleRead, readCount } = useReadState(data?.week);
  const { isNewWeek, dismiss: dismissNewWeek } = useNewWeekBadge(data?.week);

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load stored filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o.search != null) setSearch(o.search);
      if (o.priority) setFilterPriority(o.priority);
      if (o.section) setFilterSection(o.section);
      if (o.product) setFilterProduct(o.product);
    } catch (_) { }
  }, []);

  // Save filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          search,
          priority: filterPriority,
          section: filterSection,
          product: filterProduct,
        })
      );
    } catch (_) { }
  }, [search, filterPriority, filterSection, filterProduct]);

  const itemMatchesSearch = useCallback(
    (item: NewsletterItem, query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return true;
      const searchableParts: string[] = [
        item.title ?? '',
        item.content ?? '',
        ...(item.bullet_points || []),
        ...(item.attachments || []),
        ...(item.products || []).flatMap((p) =>
          [p.code, p.name, p.old_code, p.new_code].filter((x): x is string => Boolean(x))
        ),
        ...(item.stock_updates || []).flatMap((s) =>
          [s.code, s.name, s.status].filter((x): x is string => Boolean(x))
        ),
        ...(item.contacts || []).flatMap((c) =>
          [c.name, c.role, c.email, c.phone].filter((x): x is string => Boolean(x))
        ),
      ];
      const searchable = normalizeText(searchableParts.join(' '));
      const words = trimmed
        .split(/\s+/)
        .map((w) => normalizeText(w))
        .filter(Boolean);
      return words.every((word) => searchable.includes(word));
    },
    []
  );

  const itemMatchesFilters = useCallback(
    (item: NewsletterItem, sectionTitle: string) => {
      if (filterPriority && item.priority !== filterPriority) return false;
      if (filterSection && sectionTitle !== filterSection) return false;
      if (filterProduct && item.products && item.products.length) {
        const hasProduct = item.products.some(
          (p) =>
            normalizeText(p.code || '').includes(filterProduct) ||
            normalizeText(p.name || '').includes(filterProduct) ||
            normalizeText(p.old_code || '').includes(filterProduct) ||
            normalizeText(p.new_code || '').includes(filterProduct)
        );
        if (!hasProduct) return false;
      }
      return true;
    },
    [filterPriority, filterSection, filterProduct]
  );

  const itemMatches = useCallback(
    (item: NewsletterItem, sectionTitle: string) => {
      return itemMatchesSearch(item, search) && itemMatchesFilters(item, sectionTitle);
    },
    [search, itemMatchesSearch, itemMatchesFilters]
  );

  // Auto-expand sections with search matches
  useEffect(() => {
    if (!search.trim() || !data?.sections) return;
    setSectionsOpen((prev) => {
      const next = { ...prev };
      data.sections.forEach((sec, i) => {
        const hasMatch = (sec.items ?? []).some((item) =>
          itemMatchesSearch(item, search) && itemMatchesFilters(item, sec.title)
        );
        if (hasMatch) next[`section-${i}`] = true;
      });
      return next;
    });
  }, [search, data?.sections, itemMatchesSearch, itemMatchesFilters]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilterPriority('');
    setFilterSection('');
    setFilterProduct('');
  }, []);

  const expandAll = useCallback(() => {
    if (!data?.sections) return;
    const next: Record<string, boolean> = {};
    data.sections.forEach((_, i) => { next[`section-${i}`] = true; });
    setSectionsOpen(next);
  }, [data?.sections]);

  const collapseAll = useCallback(() => {
    if (!data?.sections) return;
    const next: Record<string, boolean> = {};
    data.sections.forEach((_, i) => { next[`section-${i}`] = false; });
    setSectionsOpen(next);
  }, [data?.sections]);

  const toggleSection = useCallback((id: string) => {
    setSectionsOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Fetch data
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/dataset.json')
      .then((res) => {
        if (!res.ok) throw new Error(t(lang, 'error_load'));
        return res.json();
      })
      .then((d: NewsletterData) => {
        setData(d);
        setLoading(false);
        // Smart collapse: only open sections with HIGH priority items
        const open: Record<string, boolean> = {};
        (d.sections || []).forEach((sec, i) => {
          const hasHigh = (sec.items ?? []).some((item) => item.priority === 'HIGH');
          open[`section-${i}`] = hasHigh;
        });
        setSectionsOpen(open);
      })
      .catch((err) => {
        setLoading(false);
        setError(err?.message || t(lang, 'error_load'));
      });
  }, [lang, setData, setError, setLoading]);

  const sectionOptions = data?.sections?.map((s) => s.title) ?? [];
  const productOptions = Array.from(
    new Set(
      (data?.sections ?? []).flatMap((sec) =>
        (sec.items ?? []).flatMap((item) =>
          (item.products ?? []).flatMap((p) => [p.name, p.code].filter(Boolean) as string[])
        )
      )
    )
  ).sort();

  let hasVisibleItems = false;
  (data?.sections ?? []).forEach((sec) => {
    const count = (sec.items ?? []).filter((i) => itemMatches(i, sec.title)).length;
    if (count > 0) hasVisibleItems = true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-stone-200 dark:border-stone-800 animate-spin"
          style={{ borderTopColor: 'var(--brand)' }}
        />
        <p className="mt-5 text-stone-500 dark:text-stone-400 text-sm">{t(lang, 'loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-center text-stone-700 dark:text-stone-300 max-w-md text-sm">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand)' }}
        >
          {t(lang, 'retry')}
        </button>
      </div>
    );
  }

  if (!data?.sections?.length) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 pb-8">
        <Hero />

        {/* New week banner */}
        {isNewWeek && data?.week && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-5 text-white animate-fade-in-up"
            style={{ background: 'var(--brand)' }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Week {data.week} — new content since your last visit.</span>
              <span className="opacity-70 hidden sm:inline text-xs font-normal">Your read progress has been reset.</span>
            </div>
            <button
              type="button"
              onClick={dismissNewWeek}
              className="shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className="reader-mode:hidden">
          <QuickBar
            search={search}
            setSearch={setSearch}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            onOpenFilters={() => setFiltersOpen(true)}
          />
        </div>
        <div className="reader-mode:hidden">
          <FilterDrawer
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            filterSection={filterSection}
            setFilterSection={setFilterSection}
            filterProduct={filterProduct}
            setFilterProduct={setFilterProduct}
            onClearFilters={clearFilters}
            sectionOptions={sectionOptions}
            productOptions={productOptions}
          />
        </div>

        {!hasVisibleItems ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900">
            <p className="text-base font-semibold text-stone-900 dark:text-stone-100">{t(lang, 'empty_title')}</p>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{t(lang, 'empty_text')}</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium"
            >
              {t(lang, 'clear_filters')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:gap-8">
            <div className="reader-mode:hidden lg:order-1 lg:w-52 lg:shrink-0">
              <SectionNav
                sections={data.sections.map((s, i) => ({ title: s.title, id: `section-${i}` }))}
                visibleCounts={Object.fromEntries(
                  data.sections.map((s, i) => [
                    `section-${i}`,
                    (s.items ?? []).filter((item) => itemMatches(item, s.title)).length,
                  ])
                )}
                readCounts={Object.fromEntries(
                  data.sections.map((s, i) => [
                    `section-${i}`,
                    readCount(s.title, s.items ?? []),
                  ])
                )}
              />
            </div>
            <div className="lg:order-2 flex-1 min-w-0 space-y-4">
              {data.sections.map((section, idx) => {
                const id = `section-${idx}`;
                const visibleCount = (section.items ?? []).filter((i) =>
                  itemMatches(i, section.title)
                ).length;
                const isOpen = sectionsOpen[id] === true;

                return (
                  <Section
                    key={idx}
                    section={section}
                    index={idx}
                    visibleCount={visibleCount}
                    isOpen={isOpen}
                    onToggle={() => toggleSection(id)}
                    itemMatches={(item) => itemMatches(item, section.title)}
                    searchQuery={search}
                    isRead={(item) => isRead(section.title, item.title)}
                    onToggleRead={(item) => toggleRead(section.title, item.title)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>
      <footer className="mt-auto py-6 px-4 border-t border-[#00704A22] print:hidden bg-gradient-to-r from-[#f0faf5] to-[#f9f5f0] dark:from-[#0d2b1f] dark:to-[#0d0d0d]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 100 100" className="shrink-0">
              <circle cx="50" cy="50" r="50" fill="var(--brand)" />
              <circle cx="50" cy="50" r="22" fill="none" stroke="white" strokeWidth="6" />
              <circle cx="50" cy="50" r="9" fill="white" />
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <line key={i} x1="50" y1="50"
                  x2={50 + 29 * Math.cos((deg - 90) * Math.PI / 180)}
                  y2={50 + 29 * Math.sin((deg - 90) * Math.PI / 180)}
                  stroke="white" strokeWidth="5" strokeLinecap="round" />
              ))}
            </svg>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Starbucks Partner Newsletter</p>
              <p className="text-xs text-stone-400">Confidential — Partner Use Only</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {t(lang, 'footer')}
          </p>
        </div>
      </footer>
    </>
  );
}
