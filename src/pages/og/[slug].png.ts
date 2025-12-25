// src/pages/og-image-only/[slug].png.ts
export const prerender = false
export const runtime = 'node'

import { getCollection } from 'astro:content'
import { Resvg } from '@resvg/resvg-js'
import type { APIContext } from 'astro'
import sharp from 'sharp'

export async function GET({ params, site }: APIContext) {
  const { slug } = params
  const post = (await getCollection('albums')).find((p) => p.slug === slug)
  if (!post) return new Response('Not found', { status: 404 })

  const width = 630
  const height = 630
  const cover = String(post.data.cover_art_url ?? '')

  // absolute URL for local /assets paths
  const coverUrl = cover.startsWith('http')
    ? cover
    : new URL(cover, site ?? 'http://localhost:4321').toString()

  // fetch and normalize any format → PNG
  const resp = await fetch(coverUrl)
  if (!resp.ok) return new Response('cover fetch failed', { status: 500 })
  const srcBuf = await resp.arrayBuffer()
  const pngBuf = await sharp(srcBuf).png().toBuffer()
  const dataHref = `data:image/png;base64,${pngBuf.toString('base64')}`

  // center the image square
  const size = Math.min(width, height) // square size that fits in frame
  const x = (width - size) / 2
  const y = (height - size) / 2

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <image href="${dataHref}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" />
  </svg>`

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render()

  return new Response(png.asPng(), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
