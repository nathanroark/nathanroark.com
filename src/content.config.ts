import { defineCollection, z } from 'astro:content'

// ---------- Books ----------
const BookSchema = z.object({
  author: z.string(),
  title: z.string(),
  published: z.coerce.date(),
  genres: z.array(z.string()),
  cover_image: z.string(),
  read: z.string(),
})
export type BookEntry = z.output<typeof BookSchema>

const books = defineCollection({
  schema: BookSchema,
})

// ---------- Albums ----------
const AlbumSchema = z.object({
  artist: z.string(),
  album: z.string(),
  release_date: z.coerce.date(),
  cover_art_url: z.string(),
  genres: z.array(z.string()),
  score: z.number().min(0).max(10).optional(), // allow 0 to 10 (e.g., 7.5/10)
  links: z.record(z.string(), z.string()).optional(), // e.g., { 'spotify': 'https://...', 'apple-music': 'https://...' }
})
export type AlbumEntry = z.output<typeof AlbumSchema>

const albums = defineCollection({
  schema: AlbumSchema,
})

// ---------- Anime ----------
const AnimeSchema = z.object({
  title: z.string(),
  releaseDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  art: z.string(),
  genre: z.array(z.string()),
  studio: z.string(),
})
export type AnimeEntry = z.output<typeof AnimeSchema>

const anime = defineCollection({
  schema: AnimeSchema,
})

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
})
export type MovieEntry = z.output<typeof MovieSchema>

const movies = defineCollection({
  schema: MovieSchema,
})

// ---------- Export ----------
export const collections = { albums, books, anime, movies }
export default collections
