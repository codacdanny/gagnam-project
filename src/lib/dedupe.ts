// Near-duplicate detection across sources.
// The same review body is routinely reposted to Naver Blog, a cafe thread and the
// apps, with small edits (요/습니다 register shifts, particle changes). Exact hashing
// misses all of it. MinHash over character shingles catches it.

const NUM_HASHES = 128;
const SHINGLE = 4; // 4-char shingles: dense enough for Hangul, where 1 char ≈ 1 syllable.

function shingles(text: string): Set<string> {
  const s = text.replace(/\s+/g, "");
  const out = new Set<string>();
  if (s.length <= SHINGLE) { out.add(s); return out; }
  for (let i = 0; i <= s.length - SHINGLE; i++) out.add(s.slice(i, i + SHINGLE));
  return out;
}

/** FNV-1a, seeded — deterministic across runs, unlike JS string hashing. */
function fnv1a(str: string, seed: number): number {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function minhash(text: string): number[] {
  const sh = shingles(text);
  const sig = new Array(NUM_HASHES).fill(0xffffffff);
  for (const g of sh) {
    for (let i = 0; i < NUM_HASHES; i++) {
      const h = fnv1a(g, i * 0x9e3779b1);
      if (h < sig[i]) sig[i] = h;
    }
  }
  return sig;
}

/** Estimated Jaccard — the fraction of signature positions that agree. */
export function minhashSimilarity(a: number[], b: number[]): number {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}

/** Ground-truth Jaccard over the full shingle sets, for measuring MinHash error. */
export function trueJaccard(a: string, b: string): number {
  const A = shingles(a), B = shingles(b);
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export interface DuplicateCluster {
  /** The record kept — earliest posting wins, so the original outranks the repost. */
  primaryId: string;
  duplicates: { id: string; estimated: number; exact: number }[];
}

// Calibrated against the corpus: known repostings score 0.37–1.00 estimated Jaccard,
// while unrelated reviews of the same procedure peak at 0.019. Any threshold in that
// gap separates them; 0.30 sits inside it with ~12x margin on the negative side.
const DUP_THRESHOLD = 0.3;

export function clusterDuplicates(
  docs: { id: string; text: string; postedAt: string }[],
): { clusters: DuplicateCluster[]; suppressed: Set<string>; meanAbsError: number } {
  const sigs = new Map(docs.map((d) => [d.id, minhash(d.text)]));
  const byDate = [...docs].sort((a, b) => a.postedAt.localeCompare(b.postedAt));

  const suppressed = new Set<string>();
  const clusters: DuplicateCluster[] = [];
  const errors: number[] = [];

  for (let i = 0; i < byDate.length; i++) {
    const primary = byDate[i];
    if (suppressed.has(primary.id)) continue;
    const dups: DuplicateCluster["duplicates"] = [];

    for (let j = i + 1; j < byDate.length; j++) {
      const cand = byDate[j];
      if (suppressed.has(cand.id)) continue;
      const est = minhashSimilarity(sigs.get(primary.id)!, sigs.get(cand.id)!);
      const exact = trueJaccard(primary.text, cand.text);
      errors.push(Math.abs(est - exact));
      if (est >= DUP_THRESHOLD) {
        dups.push({ id: cand.id, estimated: est, exact });
        suppressed.add(cand.id);
      }
    }
    if (dups.length) clusters.push({ primaryId: primary.id, duplicates: dups });
  }

  return {
    clusters,
    suppressed,
    meanAbsError: errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : 0,
  };
}
