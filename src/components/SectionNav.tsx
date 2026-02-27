'use client';

import { useEffect, useState } from 'react';

interface SectionNavProps {
  sections: { title: string; id: string }[];
  visibleCounts: Record<string, number>;
}

export function SectionNav({ sections, visibleCounts }: SectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const updateActiveSection = () => {
      const viewportTop = window.scrollY + 140;
      let current: string | null = null;
      for (let i = 0; i < sections.length; i++) {
        const { id } = sections[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const nextEl = sections[i + 1] ? document.getElementById(sections[i + 1].id) : null;
        const sectionBottom = nextEl
          ? nextEl.getBoundingClientRect().top + window.scrollY
          : sectionTop + rect.height;
        if (sectionTop <= viewportTop && viewportTop < sectionBottom) {
          current = id;
          break;
        }
      }
      setActiveId(current ?? sections[0]?.id ?? null);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, [sections]);

  return (
    <nav
      className={`sticky top-24 sm:top-[73px] z-10 mb-4 print:hidden transition-all ${
        collapsed ? 'max-h-12 overflow-hidden' : 'max-h-[80vh] overflow-y-auto'
      }`}
    >
      <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-4 py-3 text-left sm:hidden"
        >
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {activeId ? sections.find((s) => s.id === activeId)?.title ?? 'Sections' : 'Sections'}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`transition-transform ${collapsed ? '' : 'rotate-180'}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className={`${collapsed ? 'hidden sm:block' : ''} p-2`}>
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-2 py-1.5">
            Navigate
          </div>
          <ul className="space-y-0.5">
            {sections.map(({ title, id }) => {
              const count = visibleCounts[id] ?? 0;
              if (count === 0) return null;
              const isActive = activeId === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                      setCollapsed(true);
                    }}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 font-medium'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="truncate">{title}</span>
                    <span className="text-xs opacity-70 shrink-0">{count}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
