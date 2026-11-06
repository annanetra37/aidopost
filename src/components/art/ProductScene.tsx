// Illustrated product scenes used on the marketing site until real gallery images are generated
// with our own pipeline (spec S5: 10 industries × 3 styles). Pure SVG — tiny and theme-independent.
import { useId } from "react";

export type ArtProduct =
  | "perfume"
  | "mug"
  | "sneaker"
  | "candle"
  | "ring"
  | "headphones"
  | "serum"
  | "watch"
  | "tea"
  | "toy";
export type ArtStyle = "phone" | "minimalist" | "casual" | "premium";

const PALETTES: Record<ArtProduct, { body: string; accent: string; label: string }> = {
  perfume: { body: "#f9c6d3", accent: "#d4a24c", label: "#fff7ef" },
  mug: { body: "#c97b5a", accent: "#f2e3d5", label: "#8a4b33" },
  sneaker: { body: "#f5f5f4", accent: "#7c3aed", label: "#111827" },
  candle: { body: "#e9dccb", accent: "#3f6b4f", label: "#fffaf2" },
  ring: { body: "#e3b04b", accent: "#c81e47", label: "#fff3c4" },
  headphones: { body: "#1f2937", accent: "#f59e0b", label: "#9ca3af" },
  serum: { body: "#f4c27a", accent: "#ffffff", label: "#2f2a25" },
  watch: { body: "#d6d3d1", accent: "#0f766e", label: "#f8fafc" },
  tea: { body: "#86a873", accent: "#f6f1e7", label: "#3d5a2a" },
  toy: { body: "#60a5fa", accent: "#fbbf24", label: "#f472b6" },
};

function Product({ kind, id }: { kind: ArtProduct; id: string }) {
  const c = PALETTES[kind];
  const gloss = `url(#${id}-gloss)`;
  switch (kind) {
    case "perfume":
      return (
        <g>
          <rect x="150" y="128" width="100" height="22" rx="4" fill={c.accent} />
          <rect x="138" y="96" width="124" height="36" rx="8" fill={c.accent} />
          <rect x="120" y="150" width="160" height="150" rx="22" fill={c.body} />
          <rect x="120" y="150" width="160" height="150" rx="22" fill={gloss} />
          <rect x="150" y="200" width="100" height="52" rx="6" fill={c.label} />
          <text
            x="200"
            y="232"
            textAnchor="middle"
            fontSize="16"
            fontFamily="Georgia, serif"
            fill="#7a5a2b"
            letterSpacing="3"
          >
            ROSÉ
          </text>
        </g>
      );
    case "mug":
      return (
        <g>
          <path d="M258 170c36 0 40 70 0 72" stroke={c.body} strokeWidth="18" fill="none" />
          <path d="M128 150h134v120a30 30 0 0 1-30 30h-74a30 30 0 0 1-30-30Z" fill={c.body} />
          <path d="M128 150h134v120a30 30 0 0 1-30 30h-74a30 30 0 0 1-30-30Z" fill={gloss} />
          <ellipse cx="195" cy="150" rx="67" ry="10" fill={c.label} />
          <path
            d="M128 196h134"
            stroke={c.accent}
            strokeWidth="6"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
        </g>
      );
    case "sneaker":
      return (
        <g>
          <path
            d="M88 262c0-30 30-40 60-52l40-40c12-12 30-10 40 4l22 32c24 4 66 10 70 40v16H88Z"
            fill={c.body}
          />
          <path d="M88 262h232v14a8 8 0 0 1-8 8H96a8 8 0 0 1-8-8Z" fill={c.label} />
          <path
            d="M150 232c30-6 70-4 110 18"
            stroke={c.accent}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M190 182l14 18M204 172l14 18M218 166l12 18"
            stroke="#9ca3af"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M88 262c0-30 30-40 60-52l40-40c12-12 30-10 40 4l22 32c24 4 66 10 70 40v16H88Z"
            fill={gloss}
          />
        </g>
      );
    case "candle":
      return (
        <g>
          <path d="M200 92c10 14 12 26 0 38-12-12-10-24 0-38Z" fill="#fbbf24" />
          <rect x="198" y="128" width="4" height="22" fill="#44403c" />
          <rect x="130" y="146" width="140" height="154" rx="18" fill={c.body} />
          <rect x="130" y="146" width="140" height="154" rx="18" fill={gloss} />
          <rect x="146" y="196" width="108" height="60" rx="4" fill={c.label} />
          <circle cx="200" cy="214" r="9" fill={c.accent} />
          <rect x="166" y="232" width="68" height="6" rx="3" fill={c.accent} opacity=".6" />
        </g>
      );
    case "ring":
      return (
        <g>
          <ellipse cx="200" cy="232" rx="78" ry="70" fill="none" stroke={c.body} strokeWidth="22" />
          <ellipse cx="200" cy="232" rx="78" ry="70" fill="none" stroke={gloss} strokeWidth="22" />
          <path d="M170 150h60l-12-24h-36Z" fill={c.body} />
          <path d="M182 126h36l-18-26Z" fill={c.accent} />
          <path d="M190 120l10-14 4 14Z" fill="#fff" opacity=".7" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path
            d="M120 230v-30a80 80 0 0 1 160 0v30"
            stroke={c.body}
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="98" y="212" width="52" height="86" rx="22" fill={c.body} />
          <rect x="250" y="212" width="52" height="86" rx="22" fill={c.body} />
          <rect x="108" y="226" width="14" height="58" rx="7" fill={c.accent} />
          <rect x="278" y="226" width="14" height="58" rx="7" fill={c.accent} />
          <rect x="98" y="212" width="52" height="86" rx="22" fill={gloss} />
          <rect x="250" y="212" width="52" height="86" rx="22" fill={gloss} />
        </g>
      );
    case "serum":
      return (
        <g>
          <rect x="182" y="92" width="36" height="44" rx="14" fill="#2f2a25" />
          <rect x="172" y="132" width="56" height="20" rx="4" fill="#c9a26a" />
          <rect x="146" y="150" width="108" height="150" rx="20" fill={c.body} opacity=".92" />
          <rect x="146" y="150" width="108" height="150" rx="20" fill={gloss} />
          <rect x="162" y="196" width="76" height="62" rx="4" fill={c.accent} />
          <text
            x="200"
            y="224"
            textAnchor="middle"
            fontSize="11"
            fontFamily="Helvetica, Arial"
            fontWeight="700"
            fill={c.label}
            letterSpacing="2"
          >
            VIT C
          </text>
          <rect x="178" y="236" width="44" height="4" rx="2" fill={c.label} opacity=".4" />
        </g>
      );
    case "watch":
      return (
        <g>
          <rect x="172" y="84" width="56" height="232" rx="14" fill={c.accent} />
          <circle cx="200" cy="200" r="66" fill={c.body} />
          <circle cx="200" cy="200" r="54" fill={c.label} />
          <path
            d="M200 160v42l26 16"
            stroke="#111827"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="200" cy="200" r="66" fill={gloss} />
        </g>
      );
    case "tea":
      return (
        <g>
          <rect x="134" y="120" width="132" height="180" rx="10" fill={c.body} />
          <rect x="134" y="120" width="132" height="34" rx="10" fill={c.label} />
          <rect x="152" y="180" width="96" height="84" rx="48" fill={c.accent} />
          <path d="M200 200c14 10 14 28 0 42-14-14-14-32 0-42Z" fill={c.body} />
          <rect x="134" y="120" width="132" height="180" rx="10" fill={gloss} />
        </g>
      );
    case "toy":
      return (
        <g>
          <circle cx="160" cy="150" r="28" fill={c.body} />
          <circle cx="240" cy="150" r="28" fill={c.body} />
          <circle cx="200" cy="210" r="76" fill={c.body} />
          <ellipse cx="200" cy="232" rx="36" ry="26" fill={c.accent} />
          <circle cx="174" cy="196" r="8" fill="#1f2937" />
          <circle cx="226" cy="196" r="8" fill="#1f2937" />
          <circle cx="200" cy="222" r="8" fill={c.label} />
          <circle cx="200" cy="210" r="76" fill={gloss} />
        </g>
      );
  }
}

export function ProductScene({
  product,
  style,
  className = "",
}: {
  product: ArtProduct;
  style: ArtStyle;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const tilt =
    style === "phone" ? "rotate(-7 200 210) translate(-26 18) scale(.86)" : "translate(0 8)";
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}-gloss`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".18" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
        <radialGradient id={`${id}-min`} cx=".5" cy=".35" r=".8">
          <stop offset="0" stopColor="#fdfbff" />
          <stop offset="1" stopColor="#e9e1f8" />
        </radialGradient>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7efe4" />
          <stop offset="1" stopColor="#efe2cf" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9875c" />
          <stop offset="1" stopColor="#8d5f3c" />
        </linearGradient>
        <radialGradient id={`${id}-spot`} cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor="#3a3346" />
          <stop offset="1" stopColor="#0c0a10" />
        </radialGradient>
        <linearGradient id={`${id}-marble`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5f3ef" />
          <stop offset="1" stopColor="#d9d4cc" />
        </linearGradient>
        <filter id={`${id}-noise`}>
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 .18 0" />
        </filter>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {style === "phone" && (
        <g>
          <rect width="400" height="400" fill="#b9b3a8" />
          <rect y="250" width="400" height="150" fill="#a49d91" />
          <rect
            x="250"
            y="40"
            width="120"
            height="80"
            rx="4"
            fill="#d8d2c6"
            transform="rotate(8 310 80)"
          />
          <path
            d="M20 330c60-30 90 20 150-10s60 30 120 10"
            stroke="#555"
            strokeWidth="5"
            fill="none"
          />
          <circle cx="345" cy="300" r="26" fill="#857e72" />
          <rect width="400" height="400" filter={`url(#${id}-noise)`} />
          <ellipse cx="210" cy="320" rx="90" ry="10" fill="#000" opacity=".35" />
        </g>
      )}
      {style === "minimalist" && (
        <g>
          <rect width="400" height="400" fill={`url(#${id}-min)`} />
          <ellipse cx="200" cy="330" rx="140" ry="26" fill="#ddd2f2" />
          <rect x="60" y="304" width="280" height="26" fill="#ddd2f2" />
          <ellipse cx="200" cy="304" rx="140" ry="26" fill="#efe9fb" />
          <circle cx="320" cy="96" r="38" fill="#f7d5e4" opacity=".7" />
          <ellipse
            cx="200"
            cy="306"
            rx="80"
            ry="10"
            fill="#7c3aed"
            opacity=".12"
            filter={`url(#${id}-blur)`}
          />
        </g>
      )}
      {style === "casual" && (
        <g>
          <rect width="400" height="400" fill={`url(#${id}-wall)`} />
          <path d="M0 0h140L60 400H0Z" fill="#fff" opacity=".35" />
          <path d="M310 60c40 20 50 70 20 110-10-40-40-60-20-110Z" fill="#5f8f5a" />
          <path d="M330 80c-30 30-30 80 0 120" stroke="#4b7448" strokeWidth="3" fill="none" />
          <rect y="300" width="400" height="100" fill={`url(#${id}-wood)`} />
          <path d="M0 330h400M0 362h400" stroke="#7a4f30" strokeWidth="2" opacity=".35" />
          <circle cx="62" cy="322" r="28" fill="#f1ede6" />
          <circle cx="62" cy="322" r="18" fill="#6b4226" />
          <ellipse
            cx="205"
            cy="306"
            rx="96"
            ry="12"
            fill="#3b2414"
            opacity=".35"
            filter={`url(#${id}-blur)`}
          />
        </g>
      )}
      {style === "premium" && (
        <g>
          <rect width="400" height="400" fill={`url(#${id}-spot)`} />
          <rect y="300" width="400" height="100" fill={`url(#${id}-marble)`} />
          <path
            d="M0 340c80-20 120 30 200 0s140 10 200-20M40 400c40-40 120-40 160-70"
            stroke="#b8b0a4"
            strokeWidth="1.5"
            fill="none"
          />
          <rect x="300" y="250" width="70" height="50" fill="#c8a24a" />
          <rect x="300" y="244" width="70" height="8" fill="#e0c06e" />
          <ellipse
            cx="200"
            cy="304"
            rx="100"
            ry="12"
            fill="#000"
            opacity=".35"
            filter={`url(#${id}-blur)`}
          />
          <path d="M200 0 120 300h160Z" fill="#fff" opacity=".05" />
        </g>
      )}

      <g transform={tilt}>
        <Product kind={product} id={id} />
      </g>
      {style === "premium" && (
        <g transform="translate(0 608) scale(1 -1)" opacity=".12">
          <Product kind={product} id={id} />
        </g>
      )}
      {style === "phone" && <rect width="400" height="400" fill="#fff8e0" opacity=".12" />}
    </svg>
  );
}
