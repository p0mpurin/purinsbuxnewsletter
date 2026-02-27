'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNewsletter } from '@/context/NewsletterContext';
import { translations, type TranslationKey } from '@/lib/translations';
import { normalizeText } from '@/lib/utils';
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
    } catch (_) {}
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
    } catch (_) {}
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

  // Auto-expand sections with search matches so results are visible
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
    data.sections.forEach((_, i) => {
      next[`section-${i}`] = true;
    });
    setSectionsOpen(next);
  }, [data?.sections]);

  const collapseAll = useCallback(() => {
    if (!data?.sections) return;
    const next: Record<string, boolean> = {};
    data.sections.forEach((_, i) => {
      next[`section-${i}`] = false;
    });
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
        const open: Record<string, boolean> = {};
        (d.sections || []).forEach((_, i) => {
          open[`section-${i}`] = true;
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-10 h-10 border-2 border-stone-200 dark:border-stone-600 border-t-teal-500 rounded-full animate-spin" />
        <p className="mt-4 text-stone-500 dark:text-stone-400">{t(lang, 'loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
        <svg
          className="w-12 h-12 text-red-500 dark:text-red-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-center text-stone-900 dark:text-stone-100 max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
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
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {t(lang, 'empty_title')}
            </p>
            <p className="mt-2 text-stone-500 dark:text-stone-400">{t(lang, 'empty_text')}</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium"
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
              />
            </div>
            <div className="lg:order-2 flex-1 min-w-0 space-y-4">
              {data.sections.map((section, idx) => {
                const id = `section-${idx}`;
                const visibleCount = (section.items ?? []).filter((i) =>
                  itemMatches(i, section.title)
                ).length;
                const isOpen = sectionsOpen[id] !== false;

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
                />
              );
            })}
            </div>
          </div>
        )}
      </main>
      <footer className="mt-auto py-6 px-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t(lang, 'footer').replace('dataset.json', 'dataset.json')}
          </p>
        </div>
      </footer>
    </>
  );
}
