"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Props = { href: string; label: string; hideOn: string[] };

/** Phones/tablets: a quiet bar fixed at the bottom with the request action. */
export default function StickyCta({ href, label, hideOn }: Props) {
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
      </div>
    </div>
  );
}
