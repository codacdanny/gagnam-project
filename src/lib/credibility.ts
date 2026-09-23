// Review credibility scoring.
//
// Korean cosmetic-surgery review content is heavily incentivised: 체험단 (review-group)
// campaigns, 협찬 (sponsorship) and paid 원고료 posts. Korean disclosure rules pushed
// much of this into boilerplate disclaimers, which makes the strongest signals
// literally textual. Aggregating this corpus without grading it just launders
// clinic marketing into English. So every review is scored, and the score is shown.

import type { RawReview } from "@/data/corpus";

export interface Signal {
  id: string;
  label: string;
  /** Negative weights reduce credibility, positive weights raise it. */
  weight: number;
  /** The exact substring that fired this signal — no unexplained scores. */
  evidence: string;
}

interface Rule {
  id: string;
  label: string;
  weight: number;
  patterns: RegExp[];
}

/** Explicit paid/sponsored disclosure. In Korea these phrasings are near-conclusive. */
const DISCLOSURE_RULES: Rule[] = [
  { id: "fee", label: "Discloses a writing fee (원고료)", weight: -45, patterns: [/소정의\s*원고료/, /원고료를\s*제공받아/] },
  { id: "sponsored", label: "Discloses sponsorship (협찬)", weight: -45, patterns: [/협찬/] },
  { id: "campaign", label: "Review-group campaign (체험단)", weight: -45, patterns: [/체험단/] },
  { id: "free", label: "Procedure received free of charge", weight: -40, patterns: [/무료로\s*제공받아/, /무료로\s*시술/, /제공받아\s*작성/] },
  { id: "boiler", label: "Advertising-disclaimer boilerplate", weight: -20, patterns: [/본\s*포스팅은/, /작성되었습니다/] },
];

/** Structural marketing tells that survive even when disclosure is omitted. */
const PROMO_RULES: Rule[] = [
  { id: "contact", label: "Carries a booking contact handle", weight: -18, patterns: [/카톡\s*@?\S+/, /카카오톡/, /상담\s*문의/, /상담문의/, /예약\s*문의/] },
  { id: "url", label: "Contains an outbound link", weight: -15, patterns: [/https?:\/\/\S+/] },
  { id: "absolutes", label: "Absolute claims (no side effects / 100% / 무조건)", weight: -22, patterns: [/부작용\s*하나도\s*없/, /100%\s*만족/, /무조건/, /전혀\s*없었어요/, /자신있게\s*추천/] },
  { id: "superlative", label: "Superlative ranking claim", weight: -14, patterns: [/강남\s*최고/, /최고의\s*병원/] },
  { id: "urgency", label: "Promotional urgency (event / hurry)", weight: -16, patterns: [/이벤트\s*진행중/, /서둘러/, /지금\s*\S*\s*이벤트/] },
  { id: "emoji", label: "Decorative emoji clusters", weight: -8, patterns: [/[✨❤💖😍]{2,}/u] },
];

/** First-hand markers. A real patient reports cost, timeline and things that went wrong. */
const AUTHENTIC_RULES: Rule[] = [
  { id: "drawback", label: "Reports a drawback or unresolved concern", weight: +18, patterns: [/아쉽/, /불안/, /화가\s*납니다/, /후회/, /신경쓰여/, /부족해\s*보/, /잘\s*모르겠/, /짝짝이/, /비대칭/, /염증/, /풀렸/, /다릅니다|달라요/] },
  { id: "hedge", label: "Hedged rather than absolute", weight: +10, patterns: [/것\s*같아요/, /느낌이|느낌입니다/, /판단하기\s*이릅니다/, /지켜보려/] },
  { id: "process", label: "Describes consultation or aftercare process", weight: +8, patterns: [/상담실장/, /동의서/, /집도의/, /사후관리/, /실밥/, /재진|재내원/] },
];

export interface CredibilityResult {
  score: number;
  band: "Likely first-hand" | "Mixed signals" | "Likely incentivised";
  signals: Signal[];
}

function applyRules(text: string, rules: Rule[], out: Signal[]) {
  for (const rule of rules) {
    for (const p of rule.patterns) {
      const m = text.match(p);
      if (m) {
        out.push({ id: rule.id, label: rule.label, weight: rule.weight, evidence: m[0] });
        break; // one firing per rule
      }
    }
  }
}

/** Repeating the clinic's own name is a hallmark of SEO-written clinic copy. */
function brandRepetition(text: string, clinicRaw: string): Signal | null {
  const base = clinicRaw.replace(/\s+/g, "");
  if (base.length < 3) return null;
  const hits = text.split(base).length - 1;
  if (hits >= 3) {
    return {
      id: "brandrep", label: `Clinic name repeated ${hits}× in one post`,
      weight: -20, evidence: base,
    };
  }
  return null;
}

export function scoreCredibility(r: RawReview): CredibilityResult {
  const signals: Signal[] = [];
  applyRules(r.ko, DISCLOSURE_RULES, signals);
  applyRules(r.ko, PROMO_RULES, signals);
  applyRules(r.ko, AUTHENTIC_RULES, signals);

  const rep = brandRepetition(r.ko, r.clinicRaw);
  if (rep) signals.push(rep);

  // Verifiable specifics are the strongest positive evidence available.
  if (r.statedPriceKrw !== null) {
    signals.push({ id: "price", label: "States a specific price paid", weight: +14, evidence: `${r.statedPriceKrw.toLocaleString()} KRW` });
  }
  if (r.monthsPostOp !== null) {
    signals.push({ id: "timeline", label: "States a post-op timeline", weight: +12, evidence: `${r.monthsPostOp} months post-op` });
  }

  const raw = signals.reduce((acc, s) => acc + s.weight, 60);
  const score = Math.max(0, Math.min(100, raw));
  const band: CredibilityResult["band"] =
    score >= 70 ? "Likely first-hand" : score >= 40 ? "Mixed signals" : "Likely incentivised";

  return { score, band, signals: signals.sort((a, b) => a.weight - b.weight) };
}
