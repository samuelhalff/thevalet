import { t, type Locale } from "@/lib/i18n";
import { business, emailHref, phoneHref } from "@/lib/business";
import { whatsappUrl } from "@/lib/site";
import Button from "./ui/Button";
import Icon from "./ui/Icon";

/** WhatsApp, phone and email — each only when configured (env). Renders nothing otherwise. */
export default function ContactChannels({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const items = [
    whatsappUrl
      ? { key: "whatsapp", href: whatsappUrl, label: compact ? t(locale, "common.whatsapp") : t(locale, "channels.whatsappCta"), external: true }
      : null,
    phoneHref ? { key: "phone", href: phoneHref, label: business.phone, external: false } : null,
    emailHref ? { key: "email", href: emailHref, label: business.email, external: false } : null,
  ].filter(Boolean) as { key: "whatsapp" | "phone" | "email"; href: string; label: string; external: boolean }[];
  if (!items.length) return null;
  return (
    <ul className={compact ? "flex flex-wrap gap-x-6 gap-y-2" : "flex flex-col items-start gap-4"}>
      {items.map((i) => (
        <li key={i.key}>
          <Button
            href={i.href}
            variant="link"
            {...(i.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            track={{ event: "contact_channel_click", params: { channel: i.key } }}
          >
            {i.key === "whatsapp" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="mr-2 inline-block align-[-3px]">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" />
              </svg>
            ) : (
              <Icon name={i.key === "phone" ? "phone" : "mail"} size={18} className="mr-2 inline-block align-[-3px]" />
            )}
            <span className="sr-only">{t(locale, i.key === "whatsapp" ? "common.whatsapp" : i.key === "phone" ? "common.phone" : "common.email")}: </span>
            {i.label}
          </Button>
        </li>
      ))}
    </ul>
  );
}
