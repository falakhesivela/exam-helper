// Registers the TypeScript-alias resolution hooks used by `node --test`.
import { register } from "node:module"

register("./ts-alias-hooks.mjs", import.meta.url)
