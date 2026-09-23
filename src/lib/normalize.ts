// Clinic entity resolution.
// Korean clinic names vary by legal-entity suffix (의원 / 성형외과 / 성형외과의원 / 클리닉),
// by branch token (강남점, 압구정, 신사점), by spacing, and by Latin-script branding.
// This resolves surface strings to a canonical clinic entity.

/** Legal/business-type suffixes carry no identity information. Longest-first. */
const TYPE_SUFFIXES = [
  "성형외과의원", "성형외과", "피부과의원", "피부과", "클리닉", "의원", "병원",
];

/** Location/branch tokens. Longest-first so 강남점 beats 강남. */
const BRANCH_TOKENS = [
  "강남점", "압구정점", "신사점", "청담점", "삼성점", "역삼점",
  "강남", "압구정", "신사", "청담", "삼성", "역삼",
];

/**
 * English brand names, keyed by the Hangul identity core. A romanization algorithm
 * cannot recover these: 더뷰티 romanizes to "deobyuti", but the clinic brands itself
 * "THE BEAUTY". Real systems keep a curated lexicon for exactly this reason.
 */
const BRANDS_EN: Record<string, string> = {
  "더뷰티": "The Beauty",
  "라인": "Line",
  "미소플러스": "Miso Plus",
  "라온": "Raon",
  "예담": "Yedam",
  "한빛": "Hanbit",
};

/** Latin-script brandings fold to Hangul via the same lexicon: "THE BEAUTY" → 더뷰티. */
const LATIN_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(BRANDS_EN).map(([ko, en]) => [en.replace(/\s+/g, "").toLowerCase(), ko]),
);

const TYPE_EN: Record<string, string> = {
  "성형외과의원": "Plastic Surgery", "성형외과": "Plastic Surgery",
  "피부과의원": "Dermatology", "피부과": "Dermatology",
  "클리닉": "Clinic", "의원": "Clinic", "병원": "Hospital",
};

const BRANCH_EN: Record<string, string> = {
  "강남": "Gangnam", "압구정": "Apgujeong", "신사": "Sinsa",
  "청담": "Cheongdam", "삼성": "Samseong", "역삼": "Yeoksam",
};

function branchEn(b: string): string {
  return BRANCH_EN[b.replace(/점$/, "")] ?? b;
}

/** Plain-English gloss for an audit-trail token, e.g. 성형외과 → "plastic surgery". */
function gloss(token: string): string {
  const en = TYPE_EN[token] ?? (BRANCH_TOKENS.includes(token) ? branchEn(token) : null);
  return en ? ` (${en})` : "";
}

/** English brand for a Hangul identity core, or null if the lexicon has no entry. */
export function brandEn(base: string): string | null {
  return BRANDS_EN[base] ?? null;
}

/**
 * English display name built from the parsed parts: brand + entity type, then branch.
 * 라인성형외과 강남점 → "Line Plastic Surgery, Gangnam". Falls back to the Hangul core
 * for a brand the lexicon doesn't know, rather than inventing a romanization.
 */
export function englishName(p: ParsedName): string {
  const brand = brandEn(p.base) ?? p.base;
  const type = p.type ? TYPE_EN[p.type] ?? "" : "";
  const name = [brand, type].filter(Boolean).join(" ");
  return p.branch ? `${name}, ${branchEn(p.branch)}` : name;
}

export interface ParsedName {
  raw: string;
  /** Identity-bearing core, with type/branch/spacing stripped. */
  base: string;
  type: string | null;
  branch: string | null;
  /** Which transformations fired — surfaced in the UI as an audit trail. */
  steps: string[];
}

export function parseClinicName(raw: string): ParsedName {
  const steps: string[] = [];
  let s = raw.trim();

  // Fold Latin-script brand tokens to their Hangul equivalent before anything else.
  const latinMatch = s.match(/[A-Za-z][A-Za-z\s]*/g);
  if (latinMatch) {
    for (const m of latinMatch) {
      const key = m.replace(/\s+/g, "").toLowerCase();
      if (LATIN_ALIASES[key]) {
        s = s.replace(m, LATIN_ALIASES[key]);
        steps.push(`latin alias "${m.trim()}" → "${LATIN_ALIASES[key]}"`);
      }
    }
  }

  s = s.replace(/\s+/g, "");
  if (s !== raw.replace(/\s+/g, "") || /\s/.test(raw)) {
    if (/\s/.test(raw)) steps.push("collapsed whitespace");
  }

  let branch: string | null = null;
  for (const b of BRANCH_TOKENS) {
    if (s.endsWith(b)) { branch = b; s = s.slice(0, -b.length); steps.push(`stripped branch "${b}"${gloss(b)}`); break; }
    if (s.startsWith(b) && s.length > b.length + 1) { branch = b; s = s.slice(b.length); steps.push(`stripped locality prefix "${b}"${gloss(b)}`); break; }
  }

  let type: string | null = null;
  for (const t of TYPE_SUFFIXES) {
    if (s.endsWith(t)) { type = t; s = s.slice(0, -t.length); steps.push(`stripped entity type "${t}"${gloss(t)}`); break; }
  }

  // A branch token can sit between the brand and the type: 미소플러스의원압구정
  if (!branch) {
    for (const b of BRANCH_TOKENS) {
      if (s.endsWith(b)) { branch = b; s = s.slice(0, -b.length); steps.push(`stripped branch "${b}"${gloss(b)}`); break; }
    }
  }

  return { raw, base: s, type, branch, steps };
}

/** Character bigrams — the right granularity for Hangul, where one syllable block is one char. */
function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  if (s.length < 2) { if (s) out.add(s); return out; }
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

/** Sørensen–Dice coefficient over character bigrams. */
export function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const A = bigrams(a), B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size);
}

export interface ClinicEntity {
  id: string;
  /** Most fully-qualified Korean surface form — what to search for locally. */
  canonicalName: string;
  /** English display name for the target reader. */
  nameEn: string;
  /** Every distinct surface string that resolved here, with its match score. */
  variants: { raw: string; base: string; score: number; steps: string[] }[];
}

const MATCH_THRESHOLD = 0.82;

/**
 * Greedy agglomerative clustering over normalised bases.
 * Exact base match is score 1.0; otherwise Dice must clear MATCH_THRESHOLD.
 */
export function resolveClinics(rawNames: string[]): ClinicEntity[] {
  const parsed = rawNames.map(parseClinicName);
  const clusters: { base: string; members: ParsedName[]; scores: number[] }[] = [];

  for (const p of parsed) {
    let best: { idx: number; score: number } | null = null;
    for (let i = 0; i < clusters.length; i++) {
      const score = diceSimilarity(p.base, clusters[i].base);
      if (score >= MATCH_THRESHOLD && (!best || score > best.score)) best = { idx: i, score };
    }
    if (best) {
      clusters[best.idx].members.push(p);
      clusters[best.idx].scores.push(best.score);
    } else {
      clusters.push({ base: p.base, members: [p], scores: [1] });
    }
  }

  return clusters.map((c, i) => {
    // Canonical display name = the longest surface form seen, which is the most
    // fully-qualified rendering (e.g. 미소플러스성형외과 over 미소플러스).
    const canonical = [...c.members].sort((a, b) => b.raw.length - a.raw.length)[0];
    const seen = new Map<string, { raw: string; base: string; score: number; steps: string[] }>();
    c.members.forEach((m, j) => {
      if (!seen.has(m.raw)) seen.set(m.raw, { raw: m.raw, base: m.base, score: c.scores[j], steps: m.steps });
    });
    return {
      id: `clinic-${String(i + 1).padStart(2, "0")}`,
      canonicalName: canonical.raw,
      nameEn: englishName(canonical),
      variants: [...seen.values()].sort((a, b) => b.score - a.score),
    };
  });
}
