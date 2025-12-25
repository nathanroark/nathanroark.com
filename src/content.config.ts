//
// https://docs.astro.build/en/guides/content-collections/
//
// 1. Import utilities from `astro:content`
import { defineCollection } from "astro:content";

// 2. Import loader(s)
import { glob, file } from "astro/loaders";

// 3. Import Zod
import { z } from "astro/zod";

// 4. Define your collection(s)
// const blog = defineCollection({ /* ... */ });
// const dogs = defineCollection({ /* ... */ });

// 5. Export a single `collections` object to register your collection(s)
// export const collections = { blog, dogs };

// ---------- Books ----------
const BookSchema = z.object({
  author: z.string(),
  title: z.string(),
  published: z.coerce.date(),
  genres: z.array(z.string()),
  cover_image: z.string(),
  read: z.string(),
});
export type BookEntry = z.output<typeof BookSchema>;

const books = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/books" }),
  schema: BookSchema,
});

// ---------- Music ----------
const MusicSchema = z.object({
  artist: z.string(),
  album: z.string(),
  release_date: z.coerce.date(),
  cover_art_url: z.string(),
  genres: z.array(z.string()),
  score: z.number().min(0).max(10).optional(), // allow 0 to 10 (e.g., 7.5/10)
  links: z.record(z.string(), z.string()).optional(), // e.g., { 'spotify': 'https://...', 'apple-music': 'https://...' }
});
export type MusicEntry = z.output<typeof MusicSchema>;

const music = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/music" }),
  schema: MusicSchema,
});

// ---------- Anime ----------
const AnimeSchema = z.object({
  title: z.string(),
  releaseDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  art: z.string(),
  genre: z.array(z.string()),
  studio: z.string(),
});
export type AnimeEntry = z.output<typeof AnimeSchema>;

const anime = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/anime" }),
  schema: AnimeSchema,
});

// ---------- Movies ----------
const MovieSchema = z.object({
  title: z.string(),
  director: z.string().optional(),
  studio: z.string().optional(),
  genre: z.array(z.string()),
  cover_art_url: z.string(),
  release_date: z.coerce.date(),
  description: z.string().optional(),
  score: z.number().min(0).max(10).optional(),
});
export type MovieEntry = z.output<typeof MovieSchema>;

const movies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/movies" }),
  schema: MovieSchema,
});

// ---------- Export ----------
export const collections = { music, books, anime, movies };
export default collections;
