// Module-resolution hooks for `node --test`, so tests can exercise app modules
// that use TypeScript conveniences Node doesn't implement natively.
import { existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = pathToFileURL(`${import.meta.dirname}/../`).href

/** TypeScript lets you omit the extension; Node does not. Put it back. */
function withExtension(url) {
  if (existsSync(fileURLToPath(url))) return url
  for (const candidate of [`${url}.ts`, `${url}.tsx`, `${url}/index.ts`]) {
    if (existsSync(fileURLToPath(candidate))) return candidate
  }
  return url
}

export function resolve(specifier, context, next) {
  let url = null
  if (specifier.startsWith("@/")) {
    url = withExtension(new URL(specifier.slice(2), root).href)
  } else if (specifier.startsWith(".") && context.parentURL) {
    url = withExtension(new URL(specifier, context.parentURL).href)
  }
  if (url === null) return next(specifier, context)

  // Bundlers import JSON bare; Node demands an explicit import attribute.
  if (url.endsWith(".json")) {
    return {
      url,
      format: "json",
      importAttributes: { type: "json" },
      shortCircuit: true,
    }
  }
  return next(url, context)
}
