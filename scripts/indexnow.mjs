/**
 * Pings IndexNow with every public URL in the sitemap.
 *
 * IndexNow is how Bing (and Yandex, Seznam, Naver) learn about new or changed
 * pages immediately instead of waiting to recrawl. Google does not consume it.
 * Run it after any deploy that adds or edits a guide or blog post:
 *
 *   INDEXNOW_KEY=... NEXT_PUBLIC_APP_URL=https://yourdomain npm run seo:indexnow
 *
 * The key must also be served as a plain-text file at
 * https://<host>/<key>.txt containing exactly the key (see public/).
 */

const key = process.env.INDEXNOW_KEY?.trim()
const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "")

if (!key) {
  console.error("INDEXNOW_KEY is not set. Aborting.")
  process.exit(1)
}
if (!siteUrl || siteUrl.startsWith("http://localhost")) {
  console.error(
    `NEXT_PUBLIC_APP_URL must be the public production URL (got: ${siteUrl ?? "unset"}). Aborting.`,
  )
  process.exit(1)
}

const host = new URL(siteUrl).host

async function urlsFromSitemap() {
  const res = await fetch(`${siteUrl}/sitemap.xml`)
  if (!res.ok) {
    throw new Error(`Could not fetch sitemap.xml (HTTP ${res.status})`)
  }
  const xml = await res.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

const urlList = await urlsFromSitemap()
if (urlList.length === 0) {
  console.error("Sitemap contained no URLs. Aborting.")
  process.exit(1)
}

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `${siteUrl}/${key}.txt`,
    urlList,
  }),
})

// IndexNow returns 200 (accepted) or 202 (accepted, key validation pending).
if (res.ok) {
  console.log(`IndexNow accepted ${urlList.length} URLs for ${host} (HTTP ${res.status}).`)
} else {
  console.error(`IndexNow rejected the submission: HTTP ${res.status} ${await res.text()}`)
  process.exit(1)
}
