const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#16181d"/>
  <path fill="#fff" d="M17 20h30l-3 25H20L17 20Zm7 6 2 13h12l2-13H24Z"/>
</svg>`

export function GET() {
  return new Response(ICON, {
    headers: {
      "cache-control": "public, max-age=31536000, immutable",
      "content-type": "image/svg+xml",
    },
  })
}
