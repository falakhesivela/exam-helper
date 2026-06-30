// Shared warm "paper" palette + font handles for the legal pages, matching the
// landing page design. Fonts are loaded in the legal layout (next/font) which
// sets the --lp-* CSS variables these strings reference.

export const LEGAL_THEME = {
  paper: "#F3EFE7",
  ink: "#1A1C18",
  body: "#42453E",
  muted: "#6B6D64",
  accent: "#1E5C44",
  border: "#E3DCCE",
}

export const SERIF = "var(--lp-serif), 'Newsreader', serif"
export const MONO = "var(--lp-mono), 'Spline Sans Mono', monospace"
