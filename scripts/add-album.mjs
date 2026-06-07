#!/usr/bin/env node
// Quickly add an album to the music collection.
//
// Two ways to use it:
//
//   1. Search MusicBrainz (good for new + underground releases):
//        npm run add-album -- "Gorillaz" "The Mountain"
//        npm run add-album                 # fully interactive
//
//   2. Paste a Bandcamp album URL (for Bandcamp-only releases):
//        npm run add-album -- https://chatpile.bandcamp.com/album/cool-world
//
// It pulls artist / album / release date / cover art automatically, downloads
// the cover into public/assets/music/, and writes the markdown frontmatter into
// content/music/. It always lets you confirm/edit each field and prompts for
// your score. Genres and write-ups you can refine in the file afterward.

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MUSIC_DIR = path.join(ROOT, "content/music");
const COVER_DIR = path.join(ROOT, "public/assets/music");
const UA = {
  "User-Agent": "nathanroark.com-album-script/1.0 (nathanroark@protonmail.com)",
};

// ---------- prompt layer (works in a TTY and with piped stdin) ----------
const rl = readline.createInterface({ input: stdin, output: stdout });
const lineQueue = [];
const waiters = [];
let inputClosed = false;
rl.on("line", (line) => {
  const w = waiters.shift();
  if (w) w(line);
  else lineQueue.push(line);
});
rl.on("close", () => {
  inputClosed = true;
  while (waiters.length) waiters.shift()(null);
});
function nextLine() {
  if (lineQueue.length) return Promise.resolve(lineQueue.shift());
  if (inputClosed) return Promise.resolve(null);
  return new Promise((resolve) => waiters.push(resolve));
}
async function ask(q, fallback = "") {
  stdout.write(fallback ? `${q} [${fallback}] ` : `${q} `);
  const line = await nextLine();
  return (line ?? "").trim() || fallback;
}

// ---------- helpers ----------
function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize a date string to YYYY-MM-DD where possible, leaving partial
// MusicBrainz dates (e.g. "2001" or "2001-03") intact.
function normalizeDate(raw) {
  if (!raw) return "";
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(raw)) return raw;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

function titleCaseTag(tag) {
  return tag.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: UA, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.json();
}

async function downloadCover(url, destPath) {
  const res = await fetch(url, { headers: UA, redirect: "follow" });
  if (!res.ok) throw new Error(`cover download failed: ${res.status}`);
  await writeFile(destPath, Buffer.from(await res.arrayBuffer()));
}

// ---------- source: MusicBrainz + Cover Art Archive ----------
async function fromMusicBrainz(artistArg, albumArg) {
  let artist = artistArg || (await ask("Artist:"));
  let album = albumArg || (await ask("Album:"));
  if (!artist || !album) throw new Error("need both an artist and an album");

  const query = `artist:"${artist}" AND releasegroup:"${album}"`;
  console.log(`\nSearching MusicBrainz for "${artist} — ${album}"...`);
  let data = await fetchJson(
    `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(
      query,
    )}&fmt=json&limit=8`,
  );
  let groups = data["release-groups"] ?? [];
  if (groups.length === 0) {
    console.log("Nothing for that combo; retrying with a looser search...");
    data = await fetchJson(
      `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(
        `${artist} ${album}`,
      )}&fmt=json&limit=8`,
    );
    groups = data["release-groups"] ?? [];
  }
  if (groups.length === 0) {
    console.log("No MusicBrainz matches — falling back to manual entry.");
    return { artist, album };
  }

  console.log("\nMatches:");
  groups.forEach((g, i) => {
    const who = g["artist-credit"]?.map((a) => a.name).join(", ") ?? "?";
    const date = g["first-release-date"] || "????";
    const type = g["primary-type"] || "?";
    console.log(`  ${i + 1}. ${who} — ${g.title} (${date}) [${type}]`);
  });
  const pick = await ask("\nPick a match # (or 'm' for manual):", "1");
  if (pick.toLowerCase() === "m") return { artist, album };
  const g = groups[parseInt(pick, 10) - 1] ?? groups[0];

  // Genres: community tags / genres on the release-group.
  let genres = [];
  try {
    const full = await fetchJson(
      `https://musicbrainz.org/ws/2/release-group/${g.id}?inc=genres&fmt=json`,
    );
    genres = (full.genres ?? [])
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .slice(0, 3)
      .map((x) => titleCaseTag(x.name));
  } catch {
    /* genres are optional */
  }

  // Cover art via the Cover Art Archive (release-group front image).
  let coverUrl = null;
  try {
    const caa = await fetchJson(
      `https://coverartarchive.org/release-group/${g.id}`,
    );
    const front =
      caa.images?.find((i) => i.front) ?? caa.images?.[0] ?? null;
    // Prefer a downsized thumbnail (the full image is often 3000px / many MB).
    coverUrl =
      front?.thumbnails?.["1200"] ??
      front?.thumbnails?.large ??
      front?.thumbnails?.["500"] ??
      front?.image ??
      null;
  } catch {
    /* no art available */
  }

  return {
    artist: g["artist-credit"]?.map((a) => a.name).join(", ") || artist,
    album: g.title || album,
    release_date: normalizeDate(g["first-release-date"]),
    genres,
    coverUrl,
  };
}

// ---------- source: Bandcamp album page ----------
async function fromBandcamp(url) {
  console.log(`\nFetching Bandcamp page...`);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
  if (!res.ok) throw new Error(`Bandcamp returned ${res.status}`);
  const html = await res.text();

  let ld = {};
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (m) {
    try {
      ld = JSON.parse(m[1]);
    } catch {
      /* fall back to og tags below */
    }
  }
  const og = (prop) =>
    html.match(new RegExp(`<meta property="${prop}" content="([^"]+)"`))?.[1];

  const artist = ld.byArtist?.name || ld.publisher?.name || "";
  const album = ld.name || og("og:title") || "";
  const release_date = normalizeDate(ld.datePublished || "");
  const image = (Array.isArray(ld.image) ? ld.image[0] : ld.image) || og("og:image");
  const genres = (ld.keywords ?? [])
    .filter(Boolean)
    .slice(0, 3)
    .map(titleCaseTag);

  return { artist, album, release_date, genres, coverUrl: image || null };
}

// ---------- frontmatter ----------
function buildYaml(obj) {
  const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
  const lines = ["---"];
  lines.push(`artist: ${q(obj.artist)}`);
  lines.push(`album: ${q(obj.album)}`);
  lines.push(`release_date: ${q(obj.release_date)}`);
  lines.push(`genres: [${obj.genres.map(q).join(", ")}]`);
  lines.push(`cover_art_url: ${q(obj.cover_art_url)}`);
  if (obj.score !== null && obj.score !== "")
    lines.push(`score: ${obj.score}`);
  lines.push("---");
  return lines.join("\n") + "\n";
}

// ---------- main ----------
async function main() {
  const argv = process.argv.slice(2);
  const urlArg = argv.find((a) => /^https?:\/\//.test(a));

  let info;
  if (urlArg && urlArg.includes("bandcamp.com")) {
    info = await fromBandcamp(urlArg);
  } else if (urlArg) {
    throw new Error("Only Bandcamp URLs are supported. For others, search by name.");
  } else {
    info = await fromMusicBrainz(argv[0], argv[1]);
  }

  // Confirm / edit every field.
  console.log("");
  const artist = await ask("Artist:", info.artist ?? "");
  const album = await ask("Album:", info.album ?? "");
  const release_date = normalizeDate(
    await ask("Release date (YYYY-MM-DD):", info.release_date ?? ""),
  );
  const genresRaw = await ask(
    "Genres (comma separated):",
    (info.genres ?? []).join(", "),
  );
  const genres = genresRaw.split(",").map((g) => g.trim()).filter(Boolean);
  const score = await ask("Score 0-10 (blank to skip):", "");

  if (!artist || !album) throw new Error("artist and album are required");
  const slug = slugify(`${artist} ${album}`);

  // Cover art.
  await mkdir(COVER_DIR, { recursive: true });
  let cover_art_url = `/assets/music/${slug}.jpg`;
  if (info.coverUrl) {
    try {
      console.log("\nDownloading cover art...");
      await downloadCover(info.coverUrl, path.join(COVER_DIR, `${slug}.jpg`));
      console.log(`  Saved -> public/assets/music/${slug}.jpg`);
    } catch (err) {
      console.warn(`  Cover download failed (${err.message}).`);
      cover_art_url = await ask(
        `Drop a cover at public/assets/music/${slug}.jpg later. cover_art_url:`,
        cover_art_url,
      );
    }
  } else {
    console.log("\nNo cover art found automatically.");
    cover_art_url = await ask(
      `Drop a cover at public/assets/music/${slug}.jpg later. cover_art_url:`,
      cover_art_url,
    );
  }

  // Write the markdown file.
  await mkdir(MUSIC_DIR, { recursive: true });
  const mdPath = path.join(MUSIC_DIR, `${slug}.md`);
  if (existsSync(mdPath)) {
    const ok = await ask(`\n${slug}.md exists. Overwrite? (y/N):`, "N");
    if (ok.toLowerCase() !== "y") {
      console.log("Aborted, existing file untouched.");
      return;
    }
  }
  const content = buildYaml({
    artist,
    album,
    release_date,
    genres,
    cover_art_url,
    score: score === "" ? "" : Number(score),
  });
  await writeFile(mdPath, content);
  console.log(`\nWrote content/music/${slug}.md:\n`);
  console.log(content);
  console.log("Done. Edit the file to add a write-up or track listing if you want.");
}

main()
  .catch((err) => {
    console.error("\nError:", err.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
