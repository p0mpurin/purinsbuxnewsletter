'use client';

import { useEffect, useState } from 'react';

interface SectionNavProps {
  sections: { title: string; id: string }[];
  visibleCounts: Record<string, number>;
  readCounts?: Record<string, number>;
}

export function SectionNav({ sections, visibleCounts, readCounts }: SectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const viewportTop = window.scrollY + 160;
      let current: string | null = null;
      for (let i = 0; i < sections.length; i++) {
        const { id } = sections[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const nextEl = sections[i + 1] ? document.getElementById(sections[i + 1].id) : null;
        const bottom = nextEl
          ? nextEl.getBoundingClientRect().top + window.scrollY
          : top + el.offsetHeight;
        if (top <= viewportTop && viewportTop < bottom) {
          current = id;
          break;
        }
      }
      setActiveId(current ?? sections[0]?.id ?? null);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [sections]);

  const visibleSections = sections.filter(({ id }) => (visibleCounts[id] ?? 0) > 0);

  return (
    <>
      {/* ── Desktop sidebar nav ─────────────────────────────── */}
      <nav className="hidden lg:block sticky top-[76px] self-start print:hidden">
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: 'var(--brand)' }} />
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Navigate
            </span>
          </div>

          {/* Links */}
          <ul className="p-1.5 space-y-0.5 max-h-[calc(100vh-180px)] overflow-y-auto">
            {visibleSections.map(({ title, id }) => {
              const count = visibleCounts[id] ?? 0;
              const isActive = activeId === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${isActive
                      ? 'text-white font-medium shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    style={isActive ? { background: 'var(--brand)' } : {}}
                  >
                    {/* Active indicator dot */}
                    {!isActive && (
                      <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600 group-hover:bg-[--brand] transition-colors shrink-0" />
                    )}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{title}</span>
                    <span
                      className={`text-[11px] shrink-0 font-semibold px-1.5 py-0.5 rounded-full ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                    >
                      {count}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── Mobile floating tab strip ─────────────────────────── */}
      <div className="lg:hidden mb-4 print:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-medium text-stone-700 dark:text-stone-300 shadow-sm"
        >
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-stone-400">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            {activeId ? (visibleSections.find((s) => s.id === activeId)?.title ?? 'Sections') : 'Sections'}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`text-stone-400 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
            {visibleSections.map(({ title, id }) => {
              const isActive = activeId === id;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    setMobileOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 text-sm border-b border-stone-100 dark:border-stone-800 last:border-0 transition-colors ${isActive ? 'font-semibold text-white' : 'text-stone-600 dark:text-stone-400'
                    }`}
                  style={isActive ? { background: 'var(--brand)' } : {}}
                >
                  <span>{title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                    {visibleCounts[id] ?? 0}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
