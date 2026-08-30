/**
 * Builds public/tracks.json (CMS-shaped MSW catalog) from TidyTuesday Spotify songs.
 * Source: https://github.com/rfordatascience/tidytuesday (2020-01-21 spotify_songs.csv)
 *
 * Usage: node scripts/tracks/generate-tracks.mjs [--target=4000]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const cacheDir = path.join(__dirname, ".cache");
const cacheCsv = path.join(cacheDir, "spotify_songs.csv");
const outJson = path.join(root, "public", "tracks.json");
const sampleJson = path.join(root, "public", "tracks.sample.json");

const SOURCE_URL =
  "https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2020/2020-01-21/spotify_songs.csv";

const targetTracks = Number(
  (process.argv.find((a) => a.startsWith("--target=")) ?? "--target=4000").slice(
    9,
  ),
);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
        continue;
      }
      if (c === '"') {
        inQuotes = false;
        continue;
      }
      field += c;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (c === "\n" || (c === "\r" && next === "\n")) {
      if (c === "\r") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (c === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function titleCaseGenre(subgenre) {
  return String(subgenre)
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function parseYear(releaseDate) {
  const m = String(releaseDate ?? "").match(/^(\d{4})/);
  return m ? Number(m[1]) : 2000;
}

function yearToEpoch(year) {
  return Date.UTC(year, 0, 1) / 1000;
}

async function ensureCsv() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const tmpDownloaded = path.join(__dirname, ".spotify_songs.csv.tmp");
  if (fs.existsSync(tmpDownloaded) && !fs.existsSync(cacheCsv)) {
    fs.renameSync(tmpDownloaded, cacheCsv);
  }
  if (fs.existsSync(cacheCsv) && fs.statSync(cacheCsv).size > 1_000_000) {
    return cacheCsv;
  }
  process.stdout.write(`Downloading ${SOURCE_URL}\n`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cacheCsv, buf);
  return cacheCsv;
}

function buildCatalog(rows, header) {
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  const byId = new Map();

  for (const cols of rows) {
    if (cols.length < header.length) continue;
    const trackId = cols[col.track_id]?.trim();
    const title = cols[col.track_name]?.trim();
    const artist = cols[col.track_artist]?.trim();
    const album = cols[col.track_album_name]?.trim();
    const subgenre = cols[col.playlist_subgenre]?.trim();
    if (!trackId || !title || !artist || !subgenre) continue;

    const popularity = Number(cols[col.track_popularity] || 0);
    const year = parseYear(cols[col.track_album_release_date]);
    const genreId = slugify(subgenre);
    if (!genreId) continue;

    const prev = byId.get(trackId);
    if (prev && prev.popularity >= popularity) continue;

    byId.set(trackId, {
      trackId,
      title,
      artist,
      album: album || title,
      subgenre,
      genreId,
      genreLabel: titleCaseGenre(subgenre),
      popularity,
      year,
    });
  }

  const all = [...byId.values()];
  const byGenre = new Map();
  for (const track of all) {
    const list = byGenre.get(track.genreId) ?? [];
    list.push(track);
    byGenre.set(track.genreId, list);
  }

  for (const list of byGenre.values()) {
    list.sort((a, b) => b.popularity - a.popularity || a.title.localeCompare(b.title));
  }

  const genreIds = [...byGenre.keys()].sort((a, b) =>
    (byGenre.get(a)?.[0]?.genreLabel ?? a).localeCompare(
      byGenre.get(b)?.[0]?.genreLabel ?? b,
      "en",
    ),
  );

  const perGenre = Math.max(1, Math.floor(targetTracks / genreIds.length));
  const picked = [];
  for (const genreId of genreIds) {
    const list = byGenre.get(genreId) ?? [];
    picked.push(...list.slice(0, perGenre));
  }

  // Fill remainder from leftovers by popularity for nicer head.
  if (picked.length < targetTracks) {
    const used = new Set(picked.map((t) => t.trackId));
    const leftovers = all
      .filter((t) => !used.has(t.trackId))
      .sort((a, b) => b.popularity - a.popularity);
    picked.push(...leftovers.slice(0, targetTracks - picked.length));
  }

  picked.sort(
    (a, b) =>
      b.popularity - a.popularity ||
      a.artist.localeCompare(b.artist) ||
      a.title.localeCompare(b.title),
  );

  const artistIds = new Map();
  const genreMeta = new Map();
  const content = picked.map((track, index) => {
    const n = index + 1;
    const skuId = `sellerSku${n}`;
    let artistId = artistIds.get(track.artist);
    if (!artistId) {
      artistId = `av-artist-${slugify(track.artist) || `a${artistIds.size + 1}`}`;
      // collision guard
      if ([...artistIds.values()].includes(artistId)) {
        artistId = `${artistId}-${artistIds.size + 1}`;
      }
      artistIds.set(track.artist, artistId);
    }
    if (!genreMeta.has(track.genreId)) {
      genreMeta.set(track.genreId, track.genreLabel);
    }

    const createdDate = yearToEpoch(track.year);
    const productId = slugify(track.artist) || `artist-${n}`;
    const searchTerms = `${track.artist} - ${track.title}`;

    return {
      createdBy: "musicadmin",
      createdDate,
      lastModifiedBy: "musicadmin",
      lastModifiedDate: createdDate,
      id: skuId,
      type: "DIGITAL",
      name: `MS${String(n).padStart(6, "0")}`,
      inventory: {
        id: `inventory${n}`,
        embeddedSellerSKU: {
          id: skuId,
          name: `MS${String(n).padStart(6, "0")}`,
          repositoryName: "sellerSkuRepository",
        },
      },
      productsRef: [
        {
          id: productId,
          name: track.artist,
          repositoryName: "productRepository",
        },
      ],
      imageURLs: [],
      keywords: track.genreLabel,
      searchTerms,
      embeddedSku: {
        id: slugify(`${track.artist}-${track.title}`) || `track-${n}`,
        name: null,
        repositoryName: "SKURepository",
      },
      embeddedSeller: {
        id: "seller14",
        name: "Demo Seller",
        repositoryName: "sellerRepository",
      },
      orderedItems: [],
      packagedItems: [],
      attributeValues: [
        {
          id: artistId,
          attributeId: "artist",
          attributeName: "",
          attributeDescription: "",
          attributeOptions: [],
          type: "SIMPLE",
          areaUsageType: "PRODUCT_RELATED_DATA",
          value: track.artist,
          minValue: 0,
          maxValue: 0,
          active: true,
          checked: "checked",
        },
        {
          id: `av-album-${n}`,
          attributeId: "album",
          attributeName: "",
          attributeDescription: "",
          attributeOptions: [],
          type: "SIMPLE",
          areaUsageType: "PRODUCT_RELATED_DATA",
          value: track.album,
          minValue: 0,
          maxValue: 0,
          active: true,
          checked: "checked",
        },
        {
          id: `av-genre-${n}`,
          attributeId: "genre",
          attributeName: "",
          attributeDescription: "",
          attributeOptions: [],
          type: "LIST",
          areaUsageType: "PRODUCT_RELATED_DATA",
          value: track.genreId,
          minValue: 0,
          maxValue: 0,
          active: true,
          checked: "checked",
        },
      ],
      logicalTypeFilters: "",
      listTypeFilters: `genre-${track.genreId}`,
      simpleTypeFilters: `artist-${track.artist}|album-${track.album}`,
      rangeFilters: [],
      numericFilters: [],
      documentURLs: [],
      publishedForSale: true,
      randomGenerated: false,
      popularity: track.popularity,
    };
  });

  return {
    content,
    genreLabels: Object.fromEntries(genreMeta),
    stats: {
      tracks: content.length,
      artists: artistIds.size,
      genres: genreMeta.size,
      targetTracks,
      perGenre,
    },
  };
}

function toPayload(content) {
  return {
    result: {
      pages: [],
      data: {
        content,
        totalElements: content.length,
        last: true,
        number: 0,
        size: content.length,
      },
    },
  };
}

const csvPath = await ensureCsv();
const text = fs.readFileSync(csvPath, "utf8");
const table = parseCsv(text);
const header = table[0] ?? [];
const { content, genreLabels, stats } = buildCatalog(table.slice(1), header);

const payload = {
  ...toPayload(content),
  genreLabels,
  meta: {
    source: "tidytuesday/spotify_songs.csv (2020-01-21)",
    generatedAt: new Date().toISOString(),
    ...stats,
  },
};

const skuIds = content
  .map((item) => item.embeddedSku?.id)
  .filter(Boolean);

const playlistDefs = [
  {
    id: "playlist-current-day",
    text: "Плейлист дня",
    searchTerms: "Daily Playlist,Плейлист дня",
    titles: { ru: "Плейлист дня", en: "Daily Playlist" },
  },
  {
    id: "top-100-dance",
    text: "Танцевальные хиты",
    searchTerms: "Top 100 (Dance),Танцевальные хиты",
    titles: { ru: "Танцевальные хиты", en: "Top 100 (Dance)" },
  },
  {
    id: "indie-charge",
    text: "Инди-заряд",
    searchTerms: "Indie Charge,Инди-заряд",
    titles: { ru: "Инди-заряд", en: "Indie Charge" },
  },
];

const playlistsPayload = {
  result: {
    pages: [],
    data: {
      content: playlistDefs.map((def, index) => {
        const chunk = Math.ceil(skuIds.length / playlistDefs.length);
        const start = index * chunk;
        const ids = skuIds.slice(start, start + chunk);
        return {
          id: def.id,
          name: null,
          active: true,
          searchTerms: def.searchTerms,
          translations: [
            { text: def.titles.ru, lang: { isoCode: "ru" } },
            { text: def.titles.en, lang: { isoCode: "en" } },
          ],
          alias: "Product",
          parentCategories: ["playlists"],
          skuIds: ids,
          imageURLs: [],
          text: def.text,
        };
      }),
      totalElements: playlistDefs.length,
      last: true,
      number: 0,
      size: playlistDefs.length,
    },
  },
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(payload));
fs.writeFileSync(
  path.join(root, "public", "playlists.json"),
  JSON.stringify(playlistsPayload, null, 2),
);
fs.writeFileSync(
  sampleJson,
  JSON.stringify(
    {
      ...toPayload(content.slice(0, 40)),
      genreLabels,
      meta: { ...payload.meta, sample: true, tracks: Math.min(40, content.length) },
    },
    null,
    2,
  ),
);

process.stdout.write(
  `Wrote ${outJson}\n` +
    `  tracks=${stats.tracks} artists=${stats.artists} genres=${stats.genres}\n` +
    `  playlists=${playlistDefs.length}\n` +
    `  sample=${sampleJson}\n`,
);
