// Procedure normalisation.
// Clinics invent proprietary marketing names for standard procedures, and patients
// use colloquial short forms. Both must collapse to one comparable procedure.

export interface ProcedureCategory {
  id: string;
  en: string;
  ko: string;
  surgical: boolean;
  patterns: RegExp[];
}

export const PROCEDURES: ProcedureCategory[] = [
  { id: "rhinoplasty", en: "Rhinoplasty", ko: "코성형", surgical: true, patterns: [/코재수술/, /코성형/, /코\s*수술/, /^코$/] },
  { id: "eyelid", en: "Double eyelid", ko: "쌍꺼풀", surgical: true, patterns: [/쌍꺼풀/, /쌍액/, /매몰/, /절개/] },
  { id: "ptosis", en: "Ptosis correction", ko: "눈매교정", surgical: true, patterns: [/눈매교정/] },
  { id: "contouring", en: "Facial contouring", ko: "안면윤곽", surgical: true, patterns: [/윤곽/, /V라인/, /브이라인/, /사각턱(?!\s*보톡스)/, /광대축소/, /앞턱/] },
  { id: "lifting", en: "Lifting (non-surgical)", ko: "리프팅", surgical: false, patterns: [/울쎄라/, /실리프팅/, /리프팅/, /슈링크/] },
  { id: "injectable", en: "Injectables", ko: "주사시술", surgical: false, patterns: [/보톡스/, /필러/, /리쥬란/, /스킨부스터/] },
];

export function normalizeProcedure(raw: string): ProcedureCategory | null {
  for (const p of PROCEDURES) for (const pat of p.patterns) if (pat.test(raw)) return p;
  return null;
}
