"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api, ApiError, type Brand } from "./api";
import { useStudio } from "./StudioContext";
import { track } from "@/lib/analytics";

type Draft = {
  name: string;
  description: string;
  sourceType: "typed" | "website" | "social" | "name";
  sourceUrl: string | null;
};

export function BrandStep({
  onSelect,
}: {
  onSelect: (brand: { id: string; name: string }) => void;
}) {
  const t = useTranslations("studio.brand");
  const te = useTranslations("studio.errors");
  const locale = useLocale();
  const { openPaywall } = useStudio();
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<"describe" | "find">("describe");
  const [query, setQuery] = useState("");
  const [finding, setFinding] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    name: "",
    description: "",
    sourceType: "typed",
    sourceUrl: null,
  });
  const [found, setFound] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ brands: Brand[]; limit: number | null }>("/api/brands").then((r) => {
      setBrands(r.brands);
      setLimit(r.limit);
      setAdding(r.brands.length === 0);
    });
  }, []);

  const atLimit = limit !== null && (brands?.length ?? 0) >= limit;

  async function find() {
    setFinding(true);
    setNotice(null);
    setError(null);
    try {
      const r = await api<{
        found: boolean;
        name?: string;
        description?: string;
        sourceType: Draft["sourceType"];
        sourceUrl?: string | null;
      }>("/api/brands/fetch", {
        method: "POST",
        json: { query, locale },
      });
      if (r.found) {
        setDraft({
          name: r.name ?? query,
          description: r.description ?? "",
          sourceType: r.sourceType,
          sourceUrl: r.sourceUrl ?? null,
        });
        setFound(true);
      } else {
        setNotice(t("notFound"));
        setTab("describe");
        setDraft((d) => ({
          ...d,
          name: d.name || (/\s/.test(query) || !query.includes(".") ? query : ""),
        }));
      }
    } catch (e) {
      setError(te.has((e as ApiError).code) ? te((e as ApiError).code) : te("generic"));
    } finally {
      setFinding(false);
    }
  }

  async function approve() {
    setSaving(true);
    setError(null);
    try {
      const { brand } = await api<{ brand: { id: string; name: string } }>("/api/brands", {
        method: "POST",
        json: {
          name: draft.name.trim() || "My brand",
          description: draft.description.trim(),
          sourceType: tab === "describe" && !found ? "typed" : draft.sourceType,
          sourceUrl: draft.sourceUrl,
          language: locale,
        },
      });
      track("brand_saved", { source: draft.sourceType });
      onSelect(brand);
    } catch (e) {
      const code = (e as ApiError).code;
      if (code === "BRAND_LIMIT") openPaywall();
      setError(te.has(code) ? te(code) : te("generic"));
      setSaving(false);
    }
  }

  const remove = async (id: string) => {
    await api(`/api/brands?id=${id}`, { method: "DELETE" });
    setBrands((b) => b?.filter((x) => x.id !== id) ?? null);
  };

  const descOk = draft.description.trim().length >= 30 && draft.description.length <= 1000;
  const showEditor = tab === "describe" || found;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      {brands && brands.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t("saved")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {brands.map((b) => (
              <div key={b.id} className="glass group flex flex-col rounded-3xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold">{b.name}</h3>
                  <button
                    onClick={() => remove(b.id)}
                    className="text-xs text-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
                  >
                    {t("delete")}
                  </button>
                </div>
                {b.industryNames && (
                  <p className="mt-1 text-xs font-medium text-primary">
                    {t("industry", { name: b.industryNames[locale] ?? b.industryNames.en })}
                  </p>
                )}
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{b.description}</p>
                <button
                  onClick={() => onSelect(b)}
                  className="focus-ring mt-4 h-10 rounded-full bg-fg text-sm font-semibold text-bg"
                >
                  {t("useBrand")}
                </button>
              </div>
            ))}
          </div>
          {!adding && (
            <button
              onClick={() => (atLimit ? openPaywall() : setAdding(true))}
              className="focus-ring mt-4 rounded-full border border-dashed border-line px-5 py-3 text-sm font-semibold hover:bg-bg-soft"
            >
              + {t("addNew")}
            </button>
          )}
          {atLimit && adding && (
            <p className="mt-3 text-sm text-muted">{t("limit", { count: limit ?? 1 })}</p>
          )}
        </section>
      )}

      {adding && !atLimit && (
        <section className="glass mt-8 rounded-[28px] p-6 sm:p-8">
          <div role="tablist" className="inline-flex rounded-full bg-bg-soft p-1">
            {(["describe", "find"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => {
                  setTab(k);
                  setFound(false);
                }}
                className={`focus-ring rounded-full px-5 py-2 text-sm font-semibold transition ${tab === k ? "bg-card-solid shadow" : "text-muted"}`}
              >
                {k === "describe" ? t("tabDescribe") : t("tabFind")}
              </button>
            ))}
          </div>

          {notice && <p className="mt-5 rounded-2xl bg-accent-2/15 p-3 text-sm">{notice}</p>}
          {error && (
            <p className="mt-5 rounded-2xl bg-danger/10 p-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          {tab === "find" && !found && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim().length >= 2) find();
              }}
              className="mt-6"
            >
              <label className="grid gap-2 text-sm font-medium">
                {t("findLabel")}
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("findPlaceholder")}
                    dir="auto"
                    className="focus-ring h-12 min-w-0 flex-1 rounded-2xl border border-line bg-card-solid px-4 font-normal"
                  />
                  <button
                    disabled={finding || query.trim().length < 2}
                    className="focus-ring h-12 shrink-0 rounded-full bg-brand px-6 font-semibold text-white disabled:opacity-50"
                  >
                    {finding ? t("finding") : t("find")}
                  </button>
                </div>
              </label>
              {finding && (
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-bg-soft">
                  <div className="h-full w-1/3 animate-[shimmer_1.2s_linear_infinite] bg-brand" />
                </div>
              )}
            </form>
          )}

          {showEditor && (
            <div className="mt-6 grid gap-4">
              {found && <p className="text-sm font-semibold text-primary">{t("draftTitle")}</p>}
              <label className="grid gap-2 text-sm font-medium">
                {t("nameLabel")}
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder={t("namePlaceholder")}
                  dir="auto"
                  maxLength={120}
                  className="focus-ring h-12 rounded-2xl border border-line bg-card-solid px-4 font-normal"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("descLabel")}
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder={t("descPlaceholder")}
                  dir="auto"
                  rows={5}
                  maxLength={1000}
                  className="focus-ring rounded-2xl border border-line bg-card-solid p-4 font-normal leading-relaxed"
                />
                <span
                  className={`flex justify-between text-xs font-normal ${descOk || !draft.description ? "text-muted" : "text-danger"}`}
                >
                  <span>{t("minChars")}</span>
                  <span>{t("chars", { count: draft.description.length })}</span>
                </span>
              </label>
              <button
                onClick={approve}
                disabled={!descOk || saving}
                className="focus-ring h-12 rounded-full bg-brand font-semibold text-white shadow-soft transition hover:brightness-110 disabled:opacity-50"
              >
                {saving ? "…" : t("approve")}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
