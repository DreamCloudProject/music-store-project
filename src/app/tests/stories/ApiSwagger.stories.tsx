import { useState, type FormEvent } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { handlers } from "../../tests";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ParamField = {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
};

type EndpointOp = {
  id: string;
  tag: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  headers?: Record<string, string>;
  params?: ParamField[];
  buildBody?: (values: Record<string, string>) => unknown;
};

const beanBase = String(
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1/bean",
).replace(/\/$/, "");

/** Абсолютный base → живой CMS; относительный → обычно MSW на origin Storybook/Vite. */
const isLiveApiBase = /^https?:\/\//i.test(beanBase);

const beanRequestPath = `${beanBase}/request`;

const resolveRequestUrl = (path: string) =>
  /^https?:\/\//i.test(path) ? path : new URL(path, location.origin).href;

const splitList = (raw: string) =>
  raw
    .split(/[|,]/)
    .map((part) => part.trim())
    .filter(Boolean);

const paginationParams: ParamField[] = [
  {
    name: "offset",
    label: "offset",
    defaultValue: "0",
    description: "пагинация",
  },
  {
    name: "limit",
    label: "limit",
    defaultValue: "50",
    description: "пагинация; page = floor(offset/limit)+1",
  },
];

function paginationFromValues(values: Record<string, string>) {
  const offset = Number(values.offset ?? 0) || 0;
  const limit = Number(values.limit ?? 50) || 50;
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;
  return { offset, limit, visiblePages: 10, page };
}

const buildSearchArgs = (
  values: Record<string, string>,
  withPagination: boolean,
) => {
  const artists = splitList(values.artists ?? "");
  const genres = splitList(values.genres ?? "");
  const search = (values.search ?? "").trim();
  const year = (values.year ?? "").trim();
  const offset = Number(values.offset ?? 0) || 0;
  const limit = Number(values.limit ?? 10) || 10;
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;

  return {
    type: "SellerSKU",
    query: {
      isPublishedForSale: true,
      ...(artists.length ? { artist: artists.join("|") } : {}),
      ...(genres.length ? { genre: genres.join("|") } : {}),
    },
    ignoreRegexWrap: [
      "name",
      "embeddedSku",
      "productsRef",
      "isPublishedForSale",
    ],
    ...(withPagination ? { offset, limit, visiblePages: 10, page } : {}),
    ...(search
      ? { searchTerm: search, filteringStrategy: "EXCLUDE" }
      : artists.length || genres.length
        ? { filteringStrategy: "INCLUDE" }
        : {}),
    ...(year === "newer" || year === "older"
      ? {
          sortName: "lastModifiedDate",
          sortDirection: year === "older" ? "ASC" : "DESC",
        }
      : {}),
  };
};

const searchParams: ParamField[] = [
  {
    name: "search",
    label: "search",
    defaultValue: "",
    placeholder: "love",
    description: "searchTerm; при непустом значении filteringStrategy=EXCLUDE",
  },
  {
    name: "artists",
    label: "artists",
    defaultValue: "",
    placeholder: "Ed Sheeran|Maroon 5",
    description: "pipe/comma → query.artist",
  },
  {
    name: "genres",
    label: "genres",
    defaultValue: "",
    placeholder: "dance-pop|hip-hop",
    description: "pipe/comma → query.genre",
  },
  {
    name: "year",
    label: "year",
    defaultValue: "",
    description: "newer/older → sort",
    options: [
      { value: "", label: "(none)" },
      { value: "newer", label: "newer" },
      { value: "older", label: "older" },
    ],
  },
  {
    name: "offset",
    label: "offset",
    defaultValue: "0",
    description: "пагинация",
  },
  {
    name: "limit",
    label: "limit",
    defaultValue: "10",
    description: "пагинация; page = floor(offset/limit)+1",
  },
];

const ENDPOINTS: EndpointOp[] = [
  {
    id: "cms-playlists-products",
    tag: "CMS Playlists",
    method: "POST",
    path: beanRequestPath,
    summary: "1. Плейлисты (CMS Product в корне playlists)",
    description:
      "productServiceImpl.searchProducts. Корневая CMS Category `playlists` — только таксономия; в UI это плейлисты (Product). Product-артисты сюда не входят. Цепочка: Category(playlists) → Product(playlist) → SKU → SellerSKU(=Track в UI).",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    params: [
      {
        name: "categoryId",
        label: "fallIntoCategories._id",
        defaultValue: "playlists",
        description: "корневая CMS category; для плейлистов всегда playlists",
      },
      ...paginationParams,
    ],
    buildBody: (values) => {
      const categoryId =
        (values.categoryId ?? "playlists").trim() || "playlists";
      return {
        beanId: "productServiceImpl",
        scope: "PROTOTYPE",
        functionName: "searchProducts",
        args: [
          {
            "0": {
              query: {
                "fallIntoCategories._id": { $in: [categoryId] },
              },
              ignoreRegexWrap: [],
              ...paginationFromValues(values),
              sortName: "text",
              sortDirection: "ASC",
            },
          },
        ],
      };
    },
  },
  {
    id: "cms-playlist-skus",
    tag: "CMS Playlists",
    method: "POST",
    path: beanRequestPath,
    summary: "2. Треки плейлиста (CMS SKU)",
    description:
      "SKUServiceImpl.searchSKUs. В UI это ещё не полный Track: обложка/text есть, MP3 нет. id SKU → embeddedSku.id / skuId.",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    params: [
      {
        name: "productId",
        label: "fallIntoProducts._id",
        defaultValue: "playlist-current-day",
        placeholder: "playlist-current-day",
        description: "Playlist id (= Product.id) из шага 1",
      },
      ...paginationParams,
    ],
    buildBody: (values) => {
      const productId =
        (values.productId ?? "playlist-current-day").trim() ||
        "playlist-current-day";
      return {
        beanId: "SKUServiceImpl",
        scope: "PROTOTYPE",
        functionName: "searchSKUs",
        args: [
          {
            "0": {
              query: {
                "fallIntoProducts._id": { $in: [productId] },
              },
              ignoreRegexWrap: [],
              ...paginationFromValues(values),
              sortName: "text",
              sortDirection: "ASC",
            },
          },
        ],
      };
    },
  },
  {
    id: "cms-seller-sku-by-embedded",
    tag: "CMS Playlists",
    method: "POST",
    path: beanRequestPath,
    summary: "3. Трек с файлом (CMS SellerSKU → UI Track)",
    description:
      "searchManagerServiceImpl.search type=SellerSKU. Полная модель трека: атрибуты + documentURLs (MP3).",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    params: [
      {
        name: "embeddedSkuId",
        label: "embeddedSku.id",
        defaultValue: "sick-individuals-justin-prime-feat-bymia-not-alone",
        description: "SKU.id / Track.skuId",
      },
      {
        name: "searchTerm",
        label: "searchTerm",
        defaultValue: "",
        description: "обычно пусто при точном embeddedSku.id",
      },
      {
        name: "offset",
        label: "offset",
        defaultValue: "0",
      },
      {
        name: "limit",
        label: "limit",
        defaultValue: "10",
      },
    ],
    buildBody: (values) => {
      const embeddedSkuId = (values.embeddedSkuId ?? "").trim();
      const searchTerm = (values.searchTerm ?? "").trim();
      const offset = Number(values.offset ?? 0) || 0;
      const limit = Number(values.limit ?? 10) || 10;
      const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;
      return {
        beanId: "searchManagerServiceImpl",
        scope: "PROTOTYPE",
        functionName: "search",
        args: [
          {
            "0": {
              type: "SellerSKU",
              searchTerm,
              query: {
                isPublishedForSale: true,
                ...(embeddedSkuId ? { "embeddedSku.id": embeddedSkuId } : {}),
              },
              ignoreRegexWrap: [
                "id",
                "name",
                "embeddedSku",
                "productsRef",
                "isPublishedForSale",
              ],
              offset,
              limit,
              visiblePages: 10,
              page,
              sortName: "createdDate",
              sortDirection: "DESC",
            },
          },
        ],
      };
    },
  },
  {
    id: "tracks-search",
    tag: "Tracks",
    method: "POST",
    path: beanRequestPath,
    summary: "Поиск треков (search)",
    description:
      "CMS bean searchManagerServiceImpl.functionName=search. Параметры как в fetchTracksPage.",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    params: searchParams,
    buildBody: (values) => ({
      beanId: "searchManagerServiceImpl",
      scope: "PROTOTYPE",
      functionName: "search",
      args: [{ "0": buildSearchArgs(values, true) }],
    }),
  },
  {
    id: "tracks-catalog-all",
    tag: "Tracks",
    method: "POST",
    path: beanRequestPath,
    summary: "Каталог треков целиком",
    description:
      "search без пагинации (catalogAll на клиенте). Те же фильтры, что в приложении, без offset/limit/page.",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    params: searchParams.filter(
      (p) => p.name !== "offset" && p.name !== "limit",
    ),
    buildBody: (values) => ({
      beanId: "searchManagerServiceImpl",
      scope: "PROTOTYPE",
      functionName: "search",
      args: [{ "0": buildSearchArgs(values, false) }],
    }),
  },
  {
    id: "filters-artists",
    tag: "Filters",
    method: "POST",
    path: beanRequestPath,
    summary: "Значения фильтра: исполнители",
    description: "simpleFilterValues — attributeId как в fetchTrackFilters.",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    params: [
      {
        name: "attributeId",
        label: "attributeId",
        defaultValue: "artist",
        description: 'args[0]["0"]',
      },
    ],
    buildBody: (values) => ({
      beanId: "searchManagerServiceImpl",
      scope: "PROTOTYPE",
      functionName: "simpleFilterValues",
      args: [{ "0": values.attributeId || "artist" }],
    }),
  },
  {
    id: "filters-genres",
    tag: "Filters",
    method: "POST",
    path: beanRequestPath,
    summary: "Значения фильтра: жанры",
    description: "listFilterValues — attributeId как в fetchTrackFilters.",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    params: [
      {
        name: "attributeId",
        label: "attributeId",
        defaultValue: "genre",
        description: 'args[0]["0"]',
      },
    ],
    buildBody: (values) => ({
      beanId: "searchManagerServiceImpl",
      scope: "PROTOTYPE",
      functionName: "listFilterValues",
      args: [{ "0": values.attributeId || "genre" }],
    }),
  },
  {
    id: "tracks-json",
    tag: "Static / MSW",
    method: "GET",
    path: "/tracks.json",
    summary: "Локальный каталог tracks.json",
    description:
      "Статика из public/. MSW читает её для SellerSKU search и фильтров.",
  },
  {
    id: "playlists-json",
    tag: "Static / MSW",
    method: "GET",
    path: "/playlists.json",
    summary: "Локальные плейлисты playlists.json",
    description:
      "CMS-shaped Product page. MSW searchProducts отдаёт этот файл.",
  },
];

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: "#61affe",
  POST: "#49cc90",
  PUT: "#fca130",
  PATCH: "#50e3c2",
  DELETE: "#f93e3e",
};

const OP_SHELL_BG: Record<HttpMethod, string> = {
  GET: "#ebf3fb",
  POST: "#e8f6f0",
  PUT: "#faf0e6",
  PATCH: "#e8f6f4",
  DELETE: "#fcebeb",
};

type OpResult = {
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  body: string;
  error?: string;
};

const initialParamValues = (): Record<string, Record<string, string>> =>
  Object.fromEntries(
    ENDPOINTS.filter((e) => e.params?.length).map((e) => [
      e.id,
      Object.fromEntries((e.params ?? []).map((p) => [p.name, p.defaultValue])),
    ]),
  );

function ApiSwaggerExplorer() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [paramValues, setParamValues] =
    useState<Record<string, Record<string, string>>>(initialParamValues);
  const [results, setResults] = useState<Record<string, OpResult | undefined>>(
    {},
  );
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const tags = [...new Set(ENDPOINTS.map((e) => e.tag))];

  const toggle = (id: string) =>
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const setParam = (opId: string, name: string, value: string) =>
    setParamValues((prev) => ({
      ...prev,
      [opId]: { ...prev[opId], [name]: value },
    }));

  const assembledBody = (op: EndpointOp) =>
    op.buildBody
      ? JSON.stringify(op.buildBody(paramValues[op.id] ?? {}), null, 2)
      : "";

  const execute = async (op: EndpointOp) => {
    setPending((p) => ({ ...p, [op.id]: true }));
    const started = performance.now();
    try {
      const init: RequestInit = {
        method: op.method,
        headers: op.headers,
      };
      if (op.method !== "GET" && op.method !== "DELETE" && op.buildBody) {
        init.body = assembledBody(op);
      }
      const response = await fetch(resolveRequestUrl(op.path), init);
      const text = await response.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* raw */
      }
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      setResults((r) => ({
        ...r,
        [op.id]: {
          status: response.status,
          statusText: response.statusText,
          durationMs: Math.round(performance.now() - started),
          headers,
          body: pretty,
        },
      }));
    } catch (error) {
      setResults((r) => ({
        ...r,
        [op.id]: {
          status: 0,
          statusText: "Network Error",
          durationMs: Math.round(performance.now() - started),
          headers: {},
          body: "",
          error: error instanceof Error ? error.message : String(error),
        },
      }));
    } finally {
      setPending((p) => ({ ...p, [op.id]: false }));
    }
  };

  const onExecute = (event: FormEvent, op: EndpointOp) => {
    event.preventDefault();
    void execute(op);
  };

  return (
    <div
      className="min-h-screen font-sans text-[14px] antialiased"
      style={{ background: "#fafafa", color: "#3b4151" }}
    >
      <header
        className="flex items-center gap-4 px-6 py-3 text-white"
        style={{ background: "#1b1b1b" }}
      >
        <span
          className="rounded px-2 py-0.5 text-[18px] font-bold tracking-tight"
          style={{ background: "#89bf04", color: "#1b1b1b" }}
        >
          Swagger
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[18px] font-semibold leading-tight">
            Music Store API
          </h1>
          <p className="truncate text-[12px] text-white/70">
            Все HTTP-запросы приложения · base{" "}
            <code className="rounded bg-white/10 px-1">{beanBase}</code>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1460px] px-6 py-6">
        <section
          className="mb-8 rounded border bg-white p-5 shadow-sm"
          style={{ borderColor: "#d8dde7" }}
        >
          <h2 className="mb-2 text-[28px] font-bold leading-tight">
            Music Store API
          </h2>
          <p className="mb-3 max-w-[720px] text-[14px] leading-relaxed">
            Интерактивный каталог запросов. Parameters собираются в JSON body
            как в приложении. Режим:{" "}
            <strong>{isLiveApiBase ? "живой CMS" : "MSW / localhost"}</strong>
            {isLiveApiBase
              ? " — MSW для этой story отключён, fetch идёт на VITE_API_BASE_URL."
              : " — ответы через MSW handlers (относительный VITE_API_BASE_URL)."}
          </p>
          <p className="mb-3 max-w-[720px] text-[13px] leading-relaxed text-[#6b7280]">
            Цепочка плейлистов: <code>CMS Playlists</code> шаги 1 → 2 → 3.
            Скопируйте Product.id из шага 1 в fallIntoProducts, затем SKU.id в
            embeddedSku.id.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
            <div>
              <span className="font-semibold">Schemes</span>{" "}
              <code
                className="rounded px-1.5 py-0.5"
                style={{ background: "#f0f0f0" }}
              >
                {location.protocol.replace(":", "")}
              </code>
            </div>
            <div>
              <span className="font-semibold">Host</span>{" "}
              <code
                className="rounded px-1.5 py-0.5"
                style={{ background: "#f0f0f0" }}
              >
                {location.host}
              </code>
            </div>
            <div>
              <span className="font-semibold">Base path</span>{" "}
              <code
                className="rounded px-1.5 py-0.5"
                style={{ background: "#f0f0f0" }}
              >
                {beanBase}
              </code>
            </div>
          </div>
        </section>

        {tags.map((tag) => (
          <section key={tag} className="mb-8">
            <h3
              className="mb-3 border-b pb-2 text-[20px] font-semibold"
              style={{ borderColor: "#d8dde7" }}
            >
              {tag}
            </h3>
            <ul className="flex flex-col gap-2">
              {ENDPOINTS.filter((op) => op.tag === tag).map((op) => {
                const open = Boolean(openIds[op.id]);
                const result = results[op.id];
                const loading = Boolean(pending[op.id]);
                const accent = METHOD_COLOR[op.method];
                const values = paramValues[op.id] ?? {};
                return (
                  <li
                    key={op.id}
                    className="overflow-hidden rounded border"
                    style={{
                      borderColor: accent,
                      background: OP_SHELL_BG[op.method],
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(op.id)}
                      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:brightness-[0.98]"
                      aria-expanded={open}
                    >
                      <span
                        className="min-w-[70px] rounded px-2 py-1 text-center text-[14px] font-bold tracking-wide text-white uppercase"
                        style={{ background: accent }}
                      >
                        {op.method}
                      </span>
                      <code className="shrink-0 font-mono text-[14px] font-semibold">
                        {op.path}
                      </code>
                      <span className="min-w-0 flex-1 truncate text-[13px]">
                        {op.summary}
                      </span>
                      <span className="text-[18px]">{open ? "v" : ">"}</span>
                    </button>

                    {open ? (
                      <form
                        className="border-t border-black/10 bg-white px-4 py-4"
                        onSubmit={(event) => onExecute(event, op)}
                      >
                        <p className="mb-4 text-[13px] leading-relaxed">
                          {op.description}
                        </p>

                        {op.headers ? (
                          <div className="mb-4">
                            <h4 className="mb-2 text-[12px] font-bold tracking-wide uppercase">
                              Parameters - Headers
                            </h4>
                            <table className="w-full border-collapse text-[13px]">
                              <thead>
                                <tr
                                  className="border-b text-left"
                                  style={{ borderColor: "#d8dde7" }}
                                >
                                  <th className="py-1 pr-3 font-semibold">
                                    Name
                                  </th>
                                  <th className="py-1 font-semibold">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(op.headers).map(
                                  ([name, value]) => (
                                    <tr
                                      key={name}
                                      className="border-b"
                                      style={{ borderColor: "#eeeeee" }}
                                    >
                                      <td className="py-1.5 pr-3 font-mono">
                                        {name}
                                      </td>
                                      <td className="py-1.5 font-mono">
                                        {value}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : null}

                        {op.params?.length ? (
                          <div className="mb-4">
                            <h4 className="mb-2 text-[12px] font-bold tracking-wide uppercase">
                              Parameters
                            </h4>
                            <table className="w-full border-collapse text-[13px]">
                              <thead>
                                <tr
                                  className="border-b text-left"
                                  style={{ borderColor: "#d8dde7" }}
                                >
                                  <th className="w-[140px] py-1 pr-3 font-semibold">
                                    Name
                                  </th>
                                  <th className="py-1 pr-3 font-semibold">
                                    Description
                                  </th>
                                  <th className="min-w-[220px] py-1 font-semibold">
                                    Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {op.params.map((param) => (
                                  <tr
                                    key={param.name}
                                    className="border-b align-top"
                                    style={{ borderColor: "#eeeeee" }}
                                  >
                                    <td className="py-2 pr-3 font-mono font-semibold">
                                      {param.label}
                                    </td>
                                    <td
                                      className="py-2 pr-3 text-[12px]"
                                      style={{ color: "#6b7280" }}
                                    >
                                      {param.description ?? ""}
                                    </td>
                                    <td className="py-2">
                                      {param.options ? (
                                        <select
                                          className="w-full rounded border bg-white px-2 py-1.5 font-mono text-[13px] outline-none"
                                          style={{ borderColor: "#d8dde7" }}
                                          value={values[param.name] ?? ""}
                                          onChange={(event) =>
                                            setParam(
                                              op.id,
                                              param.name,
                                              event.target.value,
                                            )
                                          }
                                        >
                                          {param.options.map((opt) => (
                                            <option
                                              key={opt.value || "(none)"}
                                              value={opt.value}
                                            >
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="text"
                                          className="w-full rounded border bg-white px-2 py-1.5 font-mono text-[13px] outline-none"
                                          style={{ borderColor: "#d8dde7" }}
                                          value={values[param.name] ?? ""}
                                          placeholder={param.placeholder}
                                          onChange={(event) =>
                                            setParam(
                                              op.id,
                                              param.name,
                                              event.target.value,
                                            )
                                          }
                                        />
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}

                        {op.buildBody ? (
                          <div className="mb-4">
                            <h4 className="mb-2 text-[12px] font-bold tracking-wide uppercase">
                              Request body (assembled)
                            </h4>
                            <pre
                              className="max-h-[280px] overflow-auto rounded border p-3 font-mono text-[12px] leading-relaxed"
                              style={{
                                borderColor: "#d8dde7",
                                background: "#f7f7f7",
                              }}
                            >
                              {assembledBody(op)}
                            </pre>
                          </div>
                        ) : null}

                        <div className="mb-4 flex items-center gap-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer rounded border-0 px-4 py-2 text-[14px] font-bold text-white disabled:cursor-wait disabled:opacity-60"
                            style={{ background: "#4990e2" }}
                          >
                            {loading ? "Executing..." : "Execute"}
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer rounded border bg-white px-3 py-2 text-[13px]"
                            style={{ borderColor: "#d8dde7" }}
                            onClick={() =>
                              setResults((r) => ({
                                ...r,
                                [op.id]: undefined,
                              }))
                            }
                          >
                            Clear
                          </button>
                        </div>

                        {result ? (
                          <div
                            className="rounded border"
                            style={{
                              borderColor: "#d8dde7",
                              background: "#f7f7f7",
                            }}
                          >
                            <div
                              className="flex flex-wrap items-center gap-3 border-b px-3 py-2"
                              style={{ borderColor: "#d8dde7" }}
                            >
                              <h4 className="text-[12px] font-bold tracking-wide uppercase">
                                Responses
                              </h4>
                              <span
                                className="rounded px-2 py-0.5 font-mono text-[13px] font-bold text-white"
                                style={{
                                  background:
                                    result.status >= 200 && result.status < 300
                                      ? "#49cc90"
                                      : result.status === 0
                                        ? "#f93e3e"
                                        : "#fca130",
                                }}
                              >
                                {result.status || "ERR"} {result.statusText}
                              </span>
                              <span
                                className="text-[12px]"
                                style={{ color: "#6b7280" }}
                              >
                                {result.durationMs} ms
                              </span>
                            </div>
                            {result.error ? (
                              <pre
                                className="overflow-auto p-3 font-mono text-[12px]"
                                style={{ color: "#f93e3e" }}
                              >
                                {result.error}
                              </pre>
                            ) : (
                              <>
                                {Object.keys(result.headers).length ? (
                                  <details
                                    className="border-b px-3 py-2"
                                    style={{ borderColor: "#d8dde7" }}
                                  >
                                    <summary className="cursor-pointer text-[12px] font-semibold">
                                      Response headers
                                    </summary>
                                    <pre className="mt-2 overflow-auto font-mono text-[11px]">
                                      {JSON.stringify(result.headers, null, 2)}
                                    </pre>
                                  </details>
                                ) : null}
                                <pre className="max-h-[420px] overflow-auto p-3 font-mono text-[12px] leading-relaxed">
                                  {result.body || "(empty)"}
                                </pre>
                              </>
                            )}
                          </div>
                        ) : null}
                      </form>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "App/API (Swagger)",
  component: ApiSwaggerExplorer,
  parameters: {
    layout: "fullscreen",
    // При абсолютном VITE_API_BASE_URL не перехватываем bean/request моками.
    msw: {
      handlers: isLiveApiBase ? [] : handlers,
    },
  },
} satisfies Meta<typeof ApiSwaggerExplorer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Explorer: Story = {};
