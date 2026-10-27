"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WHATSAPP_ICON_PATH } from "./WhatsAppButton";

type Props = { href: string; label: string; whatsappHref: string; whatsappLabel: string; hideOn: string[] };

/**
 * Phones/tablets: a bar fixed at the bottom from the first screen, with the request action and
 * WhatsApp (when configured), so nothing floats over the text.
 */
export default function StickyCta({ href, label, whatsappHref, whatsappLabel, hideOn }: Props) {
  const pathname = usePathname() || "";
  const hidden = hideOn.some((p) => pathname.startsWith(p));
  const [serviceKey, setServiceKey] = useState("");

  useEffect(() => {
    // Service pages prefill the request with their own service (data attribute on <article>).
    setServiceKey(document.querySelector<HTMLElement>("[data-service-key]")?.dataset.serviceKey ?? "");
  }, [pathname]);

  useEffect(() => {
    // Reserves room at the bottom of the page and hides the floating WhatsApp button on phones.
    if (hidden) return;
    document.body.dataset.stickyCta = "";
    return () => {
      delete document.body.dataset.stickyCta;
    };
  }, [hidden]);

  if (hidden) return null;
  const withService = serviceKey ? `${href}?service=${encodeURIComponent(serviceKey)}` : href;
  return (
    <div className="sticky-cta fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <a href={withService} className="btn btn-primary btn-md flex-1">
          <span>{label}</span>
        </a>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={whatsappLabel}
            title={whatsappLabel}
            className="whatsapp-green btn btn-md !px-4"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d={WHATSAPP_ICON_PATH} />
            </svg>
          </a>
        ) : null}
      </div>
    </div>
  );
}
