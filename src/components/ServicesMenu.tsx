"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = { label: string; allLabel: string; allHref: string; links: { href: string; label: string }[] };

/** Desktop "Services" disclosure: button + list, closes on Escape, outside click and focus leaving. */
export default function ServicesMenu({ label, allLabel, allHref, links }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 underline-offset-[6px] hover:underline"
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={open ? "rotate-180 transition-transform" : "transition-transform"}>
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <div id={id} hidden={!open} className="absolute left-1/2 top-full z-50 mt-4 w-[34rem] -translate-x-1/2 rounded-panel bg-surface p-7 shadow-[inset_0_0_0_1px_rgb(var(--line))]">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="block py-1.5 text-[0.98rem] hover:text-brand" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href={allHref} className="link mt-4 inline-block text-sm" onClick={() => setOpen(false)}>
          {allLabel}
        </a>
      </div>
    </div>
  );
}
