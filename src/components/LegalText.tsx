import { withLinks } from "./RichText";
import { slugify } from "../../scripts/lib/heading-id.mjs";

/** Sectioned legal text (privacy, legal notice, terms). Supports "[label](/path/)" link markers. */
export default function LegalText({ sections }: { sections: { h: string; p: string[] }[] }) {
  return (
    <div className="prose">
      {sections.map((s) => (
        <section key={s.h}>
          <h2 id={slugify(s.h)}>{s.h}</h2>
          {s.p.map((p) => (
            <p key={p} className="mt-3">
              {withLinks(p)}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
