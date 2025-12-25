// ==================================================
// IF you want this to work, you need to install the fonts
//  then put them in public/fonts/Inter-Regular.ttf and Inter-Bold.ttf
//
// // src/pages/og/[slug].png.ts
// ==================================================
// export const prerender = false
// export const runtime = 'node' // ensure Node APIs & native addons like sharp are available
//
// import { getCollection } from 'astro:content'
// import { Resvg } from '@resvg/resvg-js'
// import type { APIContext } from 'astro'
// import sharp from 'sharp'
//
// export async function GET({ params, site }: APIContext) {
//   const { slug } = params
//   const post = (await getCollection('albums')).find((p) => p.slug === slug)
//   if (!post) return new Response('Not found', { status: 404 })
//
//   const width = 1200
//   const height = 630
//   const album = String(post.data.album ?? '')
//   const artist = String(post.data.artist ?? '')
//   const cover = String(post.data.cover_art_url ?? '')
//
//   // Build absolute URL for relative /assets/... paths
//   const coverUrl = cover.startsWith('http')
//     ? cover
//     : new URL(cover, site ?? 'http://localhost:4321').toString()
//
//   // Fetch original image (webp/jpg/jpeg/png/avif/gif, etc.)
//   const resp = await fetch(coverUrl)
//   if (!resp.ok) return new Response('cover fetch failed', { status: 500 })
//
//   // ➜ Transcode EVERYTHING to PNG so Resvg always understands it
//   const srcBuf = await resp.arrayBuffer()
//   const pngBuf = await sharp(srcBuf).png().toBuffer()
//   const dataHref = `data:image/png;base64,${pngBuf.toString('base64')}`
//
//   const albumLines = wrapText(album, 24) // roughly 24 chars per line
//   const artistLines = wrapText(artist, 30)
//
//   const padding = 32 // outer margin (p-32)
//   const gap = 32 // space between image and text
//   const imageScale = 0.8 // make image smaller to leave more text room
//
//   const imageSize = height * imageScale
//   const imgX = padding
//   const imgY = (height - imageSize) / 2 // vertically centered
//   const textX = imgX + imageSize + gap
//   const textY = imgY + 80 // slight top offset
//
//   const svg = `
//   <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
//     <defs>
//       <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
//         <stop offset="0%" stop-color="#0b0b0b"/>
//         <stop offset="100%" stop-color="#191919"/>
//       </linearGradient>
//       <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
//         <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.45"/>
//       </filter>
//     </defs>
//
//     <rect width="100%" height="100%" fill="url(#g)"/>
// <image href="${dataHref}" x="${imgX}" y="${imgY}" width="${imageSize}" height="${imageSize}"
//        preserveAspectRatio="xMidYMid slice" filter="url(#shadow)"/>
//
// <g transform="translate(${textX},${textY})">
//       <text font-family="Inter, ui-sans-serif, system-ui" font-size="48" font-weight="700" fill="#fff">
//         ${albumLines.map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : 64}">${escapeXml(line)}</tspan>`).join('')}
//       </text>
//       <text y="${albumLines.length * 90}" font-family="Inter, ui-sans-serif, system-ui" font-size="42" fill="#ddd">
//         ${artistLines.map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : 52}">${escapeXml(line)}</tspan>`).join('')}
//       </text>
//     </g>
//   </svg>`
//
//   const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render()
//
//   return new Response(png.asPng(), {
//     headers: {
//       'Content-Type': 'image/png',
//       'Cache-Control': 'public, max-age=31536000, immutable',
//     },
//   })
// }
//
// // simple word-wrap by character count (you can tweak)
// function wrapText(text: string, maxChars: number): string[] {
//   const words = text.split(/\s+/)
//   const lines: string[] = []
//   let line = ''
//   for (const word of words) {
//     if ((line + word).length > maxChars) {
//       lines.push(line.trim())
//       line = word + ' '
//     } else {
//       line += word + ' '
//     }
//   }
//   if (line) lines.push(line.trim())
//   return lines
// }
//
// function escapeXml(s: string) {
//   return s.replace(
//     /[&<>"']/g,
//     (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
//   )
// }
