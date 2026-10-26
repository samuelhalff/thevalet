"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header link; the current section is marked with the V (aria-current="page"). */
export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const active = pathname === href || pathname.startsWith(href);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className="nav-link underline-offset-[6px] hover:underline">
      {children}
    </Link>
  );
}
