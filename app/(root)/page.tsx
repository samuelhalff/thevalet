import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * "/" negotiates the language (FR fallback) and is the x-default of the home page.
 * Not indexed itself; the canonical home pages are /fr/ and /en/.
 */
export const metadata: Metadata = {
  title: "The Valet",
  robots: { index: false, follow: process.env.NEXT_PUBLIC_NOINDEX !== "true" },
  alternates: {
    canonical: `${SITE_URL}/fr/`,
    languages: { fr: `${SITE_URL}/fr/`, en: `${SITE_URL}/en/`, "x-default": `${SITE_URL}/` },
  },
};

// Fallback for hosts that ignore .htaccess: English browsers → /en/, everything else → /fr/.
const redirect = `(function(){try{var l=(navigator.languages||[navigator.language||'']).map(function(x){return String(x).slice(0,2).toLowerCase()});for(var i=0;i<l.length;i++){if(l[i]==='fr'){location.replace('/fr/');return}if(l[i]==='en'){location.replace('/en/');return}}}catch(e){}location.replace('/fr/')})();`;

export default function RootPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <p style={{ padding: 24 }}>
        <a href="/fr/" hrefLang="fr">
          Français
        </a>{" "}
        ·{" "}
        <a href="/en/" hrefLang="en">
          English
        </a>
      </p>
    </>
  );
}
