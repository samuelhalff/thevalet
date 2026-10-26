"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Props = { href: string; label: string; whatsappHref: string; whatsappLabel: string; hideOn: string[] };

/** Phones/tablets: a quiet bar fixed at the bottom with the request action (+ WhatsApp when configured). */
export default function StickyCta({ href, label, whatsappHref, whatsappLabel, hideOn }: Props) {
  const pathname = usePathname() || "";
  const hidden = hideOn.some((p) => pathname.startsWith(p));
  const [visible, setVisible] = useState(false);
  const [serviceKey, setServiceKey] = useState("");

  useEffect(() => {
    // Service pages prefill the request with their own service (data attribute on <article>).
    setServiceKey(document.querySelector<HTMLElement>("[data-service-key]")?.dataset.serviceKey ?? "");
  }, [pathname]);

  useEffect(() => {
    // Appears after the first screen so it never covers the opening of a page.
    const update = () => setVisible(window.scrollY > 320);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (hidden) return;
    document.body.dataset.stickyCta = "";
    return () => {
      delete document.body.dataset.stickyCta;
    };
  }, [hidden]);

  if (hidden) return null;
  const withService = serviceKey ? `${href}?service=${encodeURIComponent(serviceKey)}` : href;
  return (
    <div
      className={`sticky-cta fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-4 py-3 transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={visible ? undefined : true}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <a href={withService} tabIndex={visible ? undefined : -1} className="btn btn-primary btn-md flex-1">
          <span>{label}</span>
        </a>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={visible ? undefined : -1}
            aria-label={whatsappLabel}
            className="btn btn-secondary btn-md !px-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
            </svg>
          </a>
        ) : null}
      </div>
    </div>
  );
}
