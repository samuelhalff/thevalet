"use client";

import { trackEvent } from "@/lib/analytics";
import type { FieldRule } from "@/lib/form-validation";
import { fieldValue, submitToFormspark } from "@/lib/formspark";
import { attributionFields } from "@/lib/attribution";
import { Consent, Field, FormFooter, Honeypot, RequiredNote, SuccessPanel, invalidProps, type FormLabels } from "./form/FormParts";
import { useLeadForm } from "./form/useLeadForm";

export type ContactFormProps = {
  labels: FormLabels;
  channels: { value: string; label: string }[];
  locale: string;
  formsparkId: string;
  whatsappHref: string;
  privacyHref: string;
};

/** Simple contact form (name, email, optional phone, preferred channel, message, consent) → Formspark. */
export default function ContactForm({ labels, channels, locale, formsparkId, whatsappHref, privacyHref }: ContactFormProps) {
  const e = labels.errors;
  const rules: FieldRule[] = [
    { name: "name", id: "cf-name", kind: "text", required: e.name },
    { name: "email", id: "cf-email", kind: "email", required: e.email, invalid: e.emailFormat },
    { name: "message", id: "cf-message", kind: "text", required: e.message },
    { name: "consent", id: "cf-consent", kind: "checkbox", required: e.consent },
  ];

  const { status, errors, errorCount, onSubmit, onChange } = useLeadForm(rules, async (data) => {
    const value = (k: string) => fieldValue(data, k);
    // No form id configured (env): the form still renders, sending reports the fallback.
    if (!formsparkId) throw new Error("form not configured");
    await submitToFormspark(formsparkId, {
      form_type: "contact",
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      preferred_channel: value("channel"),
      message: value("message"),
      consent: true,
      site_locale: locale,
      page: window.location.pathname,
      ...attributionFields(),
    });
    // Analytics never receives form content.
    trackEvent("generate_lead", { method: "contact_form" });
  });

  if (status === "success") return <SuccessPanel title={labels.successTitle} text={labels.successText} />;

  return (
    <div className="note-card">
      <form onSubmit={onSubmit} onChange={onChange} noValidate className="space-y-7">
        <RequiredNote labels={labels} />
        <Field id="cf-name" label={labels.name} required error={errors.name}>
          <input id="cf-name" name="name" type="text" autoComplete="name" required className="field" {...invalidProps("cf-name", errors.name)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="cf-email" label={labels.email} required error={errors.email}>
            <input id="cf-email" name="email" type="email" inputMode="email" autoComplete="email" required className="field" {...invalidProps("cf-email", errors.email)} />
          </Field>
          <Field id="cf-phone" label={labels.phone} optional optionalLabel={labels.optional}>
            <input id="cf-phone" name="phone" type="tel" autoComplete="tel" className="field" />
          </Field>
        </div>
        <fieldset>
          <legend className="block text-sm font-medium">{labels.channel}</legend>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {channels.map((c, i) => (
              <label key={c.value} className="inline-flex items-center gap-2 text-[0.95rem]">
                <input type="radio" name="channel" value={c.value} defaultChecked={i === 0} className="checkbox !mt-0" />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field id="cf-message" label={labels.message} required error={errors.message}>
          <textarea id="cf-message" name="message" rows={5} required placeholder={labels.messagePlaceholder} className="field" {...invalidProps("cf-message", errors.message)} />
        </Field>
        <p className="text-sm text-muted">{labels.sensitiveNote}</p>
        <Honeypot id="cf-hp" label={labels.honeypot} />
        <Consent id="cf-consent" labels={labels} privacyHref={privacyHref} error={errors.consent} />
        {!formsparkId ? <p className="t-small border-l-2 border-brand pl-3 text-muted">{labels.fallbackText}</p> : null}
        <FormFooter labels={labels} status={status} errorCount={errorCount} submitLabel={labels.submit} whatsappHref={whatsappHref} />
      </form>
    </div>
  );
}
