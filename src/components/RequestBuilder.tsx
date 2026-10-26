"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { FieldRule } from "@/lib/form-validation";
import { fieldValue, submitToFormspark } from "@/lib/formspark";
import { attributionFields } from "@/lib/attribution";
import type { Messages } from "@/lib/i18n";
import Button from "./ui/Button";
import { Consent, Field, FieldError, FormFooter, Honeypot, SuccessPanel, invalidProps, type FormLabels } from "./form/FormParts";
import { focusAndReveal, useLeadForm } from "./form/useLeadForm";

export type RequestBuilderProps = {
  labels: FormLabels;
  r: Messages["request"];
  services: { value: string; label: string }[];
  channels: { value: string; label: string }[];
  locale: string;
  formsparkId: string;
  whatsappHref: string;
  privacyHref: string;
};

const STEPS = ["service", "when", "place", "party", "channel", "details"] as const;
type Step = (typeof STEPS)[number];

/**
 * Progressive request builder: service → date/urgency → place → party size → preferred channel →
 * minimal contact + consent. All fields live in one <form> (hidden steps stay in the DOM, so the
 * final FormData has everything). `?service=<key>` pre-selects the service and opens step 2.
 * Analytics receives step numbers only, never what was entered.
 */
export default function RequestBuilder({ labels, r, services, channels, locale, formsparkId, whatsappHref, privacyHref }: RequestBuilderProps) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState("");
  const [when, setWhen] = useState("");
  const [channel, setChannel] = useState(channels[0]?.value ?? "email");
  const [party, setParty] = useState("");
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("service");
    if (key && services.some((s) => s.value === key)) {
      setService(key);
      setStep(1);
    }
  }, [services]);

  useEffect(() => {
    // Move focus to the new step's question after Continue/Back (not on first render).
    if (moved.current) focusAndReveal(headingRef.current);
  }, [step]);

  const e = labels.errors;
  const contactRules: FieldRule[] = [
    { name: "name", id: "rq-name", kind: "text", required: e.name },
    channel === "email"
      ? { name: "email", id: "rq-email", kind: "email", required: e.email, invalid: e.emailFormat }
      : { name: "phone", id: "rq-phone", kind: "text", required: e.phone },
    { name: "consent", id: "rq-consent", kind: "checkbox", required: e.consent },
  ];

  const { status, errors, errorCount, onSubmit, onChange } = useLeadForm(contactRules, async (data) => {
    const value = (k: string) => fieldValue(data, k);
    // No form id configured (env): the form still renders, sending reports the fallback.
    if (!formsparkId) throw new Error("form not configured");
    await submitToFormspark(formsparkId, {
      form_type: "request",
      service: value("service"),
      when: value("when"),
      date: value("date"),
      time: value("time"),
      place: value("place"),
      party_size: value("party"),
      preferred_channel: value("channel"),
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      message: value("message"),
      consent: true,
      site_locale: locale,
      page: window.location.pathname,
      ...attributionFields(),
    });
    trackEvent("generate_lead", { method: "request" });
  });

  if (status === "success") return <SuccessPanel title={r.successTitle} text={r.successText} />;

  function validateStep(s: Step): Record<string, string> {
    const data = new FormData(formRef.current ?? undefined);
    const out: Record<string, string> = {};
    if (s === "service" && !fieldValue(data, "service")) out.service = e.service;
    if (s === "when") {
      if (!fieldValue(data, "when")) out.when = e.when;
      else if (fieldValue(data, "when") === "date" && !fieldValue(data, "date")) out.date = e.date;
    }
    if (s === "place" && !fieldValue(data, "place")) out.place = e.place;
    if (s === "channel" && !fieldValue(data, "channel")) out.channel = e.channel;
    return out;
  }

  function next() {
    const found = validateStep(STEPS[step]);
    setStepErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      focusAndReveal(document.getElementById(`rq-${first}`) ?? document.querySelector<HTMLElement>(`[name="${first}"]`));
      return;
    }
    if (!started.current) {
      started.current = true;
      trackEvent("request_start");
    }
    trackEvent(`request_step_${step + 1}`);
    moved.current = true;
    setStep((v) => Math.min(v + 1, STEPS.length - 1));
  }

  function back() {
    moved.current = true;
    setStepErrors({});
    setStep((v) => Math.max(v - 1, 0));
  }

  const radio = (name: string, options: { value: string; label: string }[], current: string, set: (v: string) => void) => (
    <div className="grid gap-x-10 sm:grid-cols-2" role="radiogroup" aria-invalid={stepErrors[name] ? true : undefined}>
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex cursor-pointer items-center gap-3 border-b py-3 text-[1.02rem] transition-colors ${
            current === o.value ? "border-brand text-brand" : "border-line hover:border-ink"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={current === o.value}
            onChange={() => {
              set(o.value);
              setStepErrors((p) => {
                const n = { ...p };
                delete n[name];
                return n;
              });
            }}
            className="checkbox !mt-0"
          />
          {o.label}
        </label>
      ))}
    </div>
  );

  const current = STEPS[step];
  const stepTitle: Record<Step, string> = {
    service: r.serviceQuestion,
    when: r.whenQuestion,
    place: r.placeQuestion,
    party: r.partyQuestion,
    channel: r.channelQuestion,
    details: r.detailsQuestion,
  };
  return (
    <div className="max-w-2xl">
      <p className="phrase t-3 text-brand">{r.summaryTitle}</p>
      <form
        ref={formRef}
        onSubmit={(ev) => {
          // Enter on an earlier step means "Continue", not "send".
          if (current !== "details") {
            ev.preventDefault();
            next();
            return;
          }
          onSubmit(ev);
        }}
        onChange={onChange}
        noValidate
      >
        <p className="t-small mt-6 text-muted">{r.stepOf.replace("{current}", String(step + 1)).replace("{total}", String(STEPS.length))}</p>
        <h2 ref={headingRef} tabIndex={-1} className="t-2 mt-2 focus:outline-none">
          {stepTitle[current]}
        </h2>

        <div className="mt-6" hidden={current !== "service"}>
          {radio("service", [...services, { value: "several", label: r.serviceSeveral }, { value: "other", label: r.serviceOther }], service, setService)}
          <FieldError id="rq-service" message={stepErrors.service} />
        </div>

        <div className="mt-6 space-y-5" hidden={current !== "when"}>
          {radio("when", Object.entries(r.whenOptions).map(([value, label]) => ({ value, label })), when, setWhen)}
          <FieldError id="rq-when" message={stepErrors.when} />
          {when === "date" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="rq-date" label={r.date} required error={stepErrors.date}>
                <input id="rq-date" name="date" type="date" className="field" {...invalidProps("rq-date", stepErrors.date)} />
              </Field>
              <Field id="rq-time" label={r.time} optional optionalLabel={labels.optional}>
                <input id="rq-time" name="time" type="time" className="field" />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="mt-6" hidden={current !== "place"}>
          <Field id="rq-place" label={r.place} required error={stepErrors.place}>
            <input id="rq-place" name="place" type="text" placeholder={r.placePlaceholder} className="field" {...invalidProps("rq-place", stepErrors.place)} />
          </Field>
        </div>

        <div className="mt-6" hidden={current !== "party"}>
          {radio("party", Object.entries(r.partyOptions).map(([value, label]) => ({ value, label })), party, setParty)}
        </div>

        <div className="mt-6" hidden={current !== "channel"}>
          {radio("channel", channels, channel, setChannel)}
          <FieldError id="rq-channel" message={stepErrors.channel} />
        </div>

        <div className="mt-6 space-y-5" hidden={current !== "details"}>
          <Field id="rq-name" label={labels.name} required error={errors.name}>
            <input id="rq-name" name="name" type="text" autoComplete="name" className="field" {...invalidProps("rq-name", errors.name)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="rq-email" label={labels.email} required={channel === "email"} optional={channel !== "email"} optionalLabel={labels.optional} error={errors.email}>
              <input id="rq-email" name="email" type="email" inputMode="email" autoComplete="email" className="field" {...invalidProps("rq-email", errors.email)} />
            </Field>
            <Field id="rq-phone" label={labels.phone} required={channel !== "email"} optional={channel === "email"} optionalLabel={labels.optional} error={errors.phone}>
              <input id="rq-phone" name="phone" type="tel" autoComplete="tel" className="field" {...invalidProps("rq-phone", errors.phone)} />
            </Field>
          </div>
          <Field id="rq-message" label={r.detailsMessage}>
            <textarea id="rq-message" name="message" rows={4} placeholder={r.detailsPlaceholder} className="field" />
          </Field>
          <p className="text-sm text-muted">{labels.sensitiveNote}</p>
          <Honeypot id="rq-hp" label={labels.honeypot} />
          <Consent id="rq-consent" labels={labels} privacyHref={privacyHref} error={errors.consent} />
          {!formsparkId ? <p className="t-small border-l-2 border-brand pl-3 text-muted">{labels.fallbackText}</p> : null}
          <FormFooter labels={labels} status={status} errorCount={errorCount} submitLabel={r.submit} whatsappHref={whatsappHref} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {step > 0 ? (
            <Button variant="link" onClick={back}>
              {r.back}
            </Button>
          ) : (
            <span />
          )}
          {current !== "details" ? (
            <Button onClick={next} size="lg">
              {r.next}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

