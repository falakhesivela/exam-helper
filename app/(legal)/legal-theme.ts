// Shared warm "paper" palette + font handles for the legal pages, matching the
// landing page design. Fonts are loaded in the legal layout (next/font) which
// sets the --lp-* CSS variables these strings reference.

export const LEGAL_THEME = {
  paper: "#F3EFE7",
  ink: "#1A1C18",
  body: "#3A3D36",
  muted: "#5C5E55",
  faint: "#8A8C80",
  accent: "#1E5C44",
  border: "#E3DCCE",
  /** Structural rule (section dividers, table heads) — heavier than `border`. */
  rule: "#CFC7B4",
  /** Hairline between rows within a section. */
  hair: "#E1DACA",
}

export const SERIF = "var(--lp-serif), 'Newsreader', serif"
export const MONO = "var(--lp-mono), 'Spline Sans Mono', monospace"
