// Raw ingested reviews. Each record is exactly what a source connector would emit:
// untouched Korean body text, the clinic string AS WRITTEN by the author, and source metadata.
// Nothing here is normalised — normalisation is the pipeline's job.

export type SourceId = "naver_blog" | "naver_cafe" | "babitalk" | "gangnam_unni";

export const SOURCES: Record<SourceId, { label: string; kind: string }> = {
  naver_blog: { label: "Naver Blog", kind: "Blog post" },
  naver_cafe: { label: "Naver Cafe", kind: "Forum thread" },
  babitalk: { label: "Babitalk", kind: "App review" },
  gangnam_unni: { label: "Gangnam Unni", kind: "App review" },
};

export interface RawReview {
  id: string;
  source: SourceId;
  /** Clinic name exactly as the author wrote it. Deliberately inconsistent. */
  clinicRaw: string;
  /** Procedure as written, often a clinic's invented marketing name. */
  procedureRaw: string;
  authorHandle: string;
  postedAt: string;
  ko: string;
  /** Pre-computed EN translation, segment-aligned to `ko` sentence order. */
  en: string;
  /** Price in KRW as stated in the body, null if unstated. */
  statedPriceKrw: number | null;
  monthsPostOp: number | null;
}

export const RAW_REVIEWS: RawReview[] = [
  {
    id: "r001", source: "naver_blog", clinicRaw: "라인성형외과의원", procedureRaw: "코성형",
    authorHandle: "beauty_diary_88", postedAt: "2026-03-14", statedPriceKrw: 4200000, monthsPostOp: 6,
    ko: "코 수술한지 6개월 됐어요. 처음 3주는 붓기가 심해서 후회도 했는데 지금은 자연스러워요. 비용은 420만원이었고 재수술은 아니었습니다. 다만 상담할 때 원장님이 아니라 상담실장이 거의 다 설명해서 좀 불안했어요.",
    en: "It's been 6 months since my nose surgery. The first 3 weeks the swelling was bad and I regretted it, but now it looks natural. The cost was 4.2 million won and it wasn't a revision. That said, during the consultation it was mostly the consultation manager explaining rather than the doctor, which made me a bit uneasy.",
  },
  {
    id: "r002", source: "naver_blog", clinicRaw: "강남 라인성형외과", procedureRaw: "코성형",
    authorHandle: "seoul_lifelog", postedAt: "2026-03-21", statedPriceKrw: null, monthsPostOp: null,
    ko: "본 포스팅은 라인성형외과로부터 소정의 원고료를 제공받아 작성되었습니다. 라인성형외과는 강남역 3번 출구에서 도보 5분 거리에 위치해 있으며, 라인성형외과의 원장님들은 모두 성형외과 전문의입니다. 상담 예약은 카톡으로 가능합니다! 라인성형외과 추천드려요~",
    en: "This post was written with a fee provided by Line Plastic Surgery. Line Plastic Surgery is a 5-minute walk from Gangnam Station Exit 3, and all of Line Plastic Surgery's directors are board-certified plastic surgeons. Consultation bookings are available via KakaoTalk! I recommend Line Plastic Surgery~",
  },
  {
    id: "r003", source: "babitalk", clinicRaw: "라인성형외과", procedureRaw: "자연유착 쌍꺼풀",
    authorHandle: "mint_choco", postedAt: "2026-01-09", statedPriceKrw: 1800000, monthsPostOp: 4,
    ko: "쌍꺼풀 자연유착으로 했는데 180만원 들었어요. 라인이 짝짝이로 잡혀서 4개월째인데 아직도 신경쓰여요. 재수술 상담 받으러 갔더니 6개월은 더 기다리라고 하시네요.",
    en: "I had the natural-adhesion double eyelid procedure and it cost 1.8 million won. The crease came out uneven and at 4 months it still bothers me. When I went for a revision consultation they told me to wait another 6 months.",
  },
  {
    id: "r004", source: "gangnam_unni", clinicRaw: "라인성형외과 강남점", procedureRaw: "쌍꺼풀",
    authorHandle: "u_2847193", postedAt: "2026-02-02", statedPriceKrw: 1750000, monthsPostOp: 2,
    ko: "쌍꺼풀 수술 받았습니다. 175만원. 2개월차고 붓기는 거의 빠졌어요. 원장님이 직접 수술하시는지 확인하고 갔습니다.",
    en: "I had double eyelid surgery. 1.75 million won. I'm 2 months in and the swelling has mostly gone down. I checked beforehand that the director would perform the surgery himself.",
  },
  {
    id: "r005", source: "naver_cafe", clinicRaw: "라인성형외과", procedureRaw: "코재수술",
    authorHandle: "익명2938", postedAt: "2026-04-01", statedPriceKrw: 6500000, monthsPostOp: 11,
    ko: "코재수술 650만원에 했어요. 첫 수술을 다른 병원에서 망쳐서 왔는데 여기서는 만족합니다. 다만 수술 당일에 담당 원장님 얼굴을 수술 직전에야 봤다는 게 좀 그랬어요. 결과는 좋습니다.",
    en: "I had revision rhinoplasty for 6.5 million won. I came here after my first surgery was botched at another hospital, and I'm satisfied with this one. The only odd thing was that I didn't see the operating director's face until right before surgery on the day. The result is good.",
  },
  {
    id: "r006", source: "naver_blog", clinicRaw: "예담의원", procedureRaw: "눈매교정",
    authorHandle: "daily_log_j", postedAt: "2026-02-18", statedPriceKrw: 2400000, monthsPostOp: 5,
    ko: "눈매교정 240만원. 5개월 지났고 자연스럽게 잘 잡혔어요. 사후관리 문자도 꾸준히 오고 실밥 제거할 때도 친절했습니다. 비싼 편이지만 후회는 없어요.",
    en: "Ptosis correction, 2.4 million won. It's been 5 months and it settled naturally. They send follow-up care texts consistently and were kind during suture removal. It's on the expensive side but I have no regrets.",
  },
  {
    id: "r007", source: "babitalk", clinicRaw: "예담 성형외과", procedureRaw: "눈매교정",
    authorHandle: "hana_k", postedAt: "2026-02-20", statedPriceKrw: 2400000, monthsPostOp: 5,
    ko: "눈매교정 240만원. 5개월 지났고 자연스럽게 잘 잡혔어요. 사후관리 문자도 꾸준히 오고 실밥 제거할 때도 친절했습니다. 비싼 편이지만 후회는 없어요.",
    en: "Ptosis correction, 2.4 million won. It's been 5 months and it settled naturally. They send follow-up care texts consistently and were kind during suture removal. It's on the expensive side but I have no regrets.",
  },
  {
    id: "r008", source: "gangnam_unni", clinicRaw: "예담의원 강남점", procedureRaw: "눈매교정술",
    authorHandle: "u_9928374", postedAt: "2026-02-19", statedPriceKrw: 2400000, monthsPostOp: 5,
    ko: "눈매교정 240만원 했습니다. 5개월 지났는데 자연스럽게 잘 잡혔어요. 사후관리 문자도 꾸준히 오고 실밥 제거할 때 친절했습니다. 비싼 편이지만 후회 없어요.",
    en: "I had ptosis correction for 2.4 million won. It's been 5 months and it settled naturally. They send follow-up care texts consistently and were kind at suture removal. Expensive side but no regrets.",
  },
  {
    id: "r009", source: "naver_cafe", clinicRaw: "예담클리닉", procedureRaw: "쌍꺼풀 매몰",
    authorHandle: "익명8812", postedAt: "2026-05-06", statedPriceKrw: 900000, monthsPostOp: 3,
    ko: "매몰법 90만원에 했는데 3개월만에 한쪽이 풀렸어요. 재수술 비용은 반값으로 해준다고 하는데 그것도 45만원이잖아요. 좀 화가 납니다.",
    en: "I had the buried-suture method for 900,000 won and one side came undone after just 3 months. They say the revision is half price, but that's still 450,000 won. I'm rather angry about it.",
  },
  {
    id: "r010", source: "naver_blog", clinicRaw: "예담의원", procedureRaw: "리프팅",
    authorHandle: "review_master_kr", postedAt: "2026-04-11", statedPriceKrw: null, monthsPostOp: null,
    ko: "예담의원에서 체험단으로 리프팅 시술을 무료로 제공받아 작성한 후기입니다! 원장님이 정말 친절하시고 시설도 너무 깨끗해요. 강남 최고의 병원이라고 자신있게 추천드립니다. 문의는 아래 링크로! http://example.kr/yedam",
    en: "This is a review written after receiving a free lifting procedure from Yedam Clinic as part of a review-group campaign! The director is really kind and the facilities are so clean. I confidently recommend it as the best clinic in Gangnam. Inquiries via the link below! http://example.kr/yedam",
  },
  {
    id: "r011", source: "naver_blog", clinicRaw: "미소플러스성형외과", procedureRaw: "V라인 윤곽",
    authorHandle: "jiwon_writes", postedAt: "2026-01-27", statedPriceKrw: 8900000, monthsPostOp: 9,
    ko: "사각턱이랑 앞턱 같이 해서 890만원 나왔어요. 9개월 됐고 라인은 확실히 부드러워졌습니다. 근데 아랫입술 감각이 아직 완전히 안 돌아왔어요. 이건 수술 전에 설명 들었던 부분이라 감수하고 있습니다.",
    en: "I had jaw angle reduction and chin done together, which came to 8.9 million won. It's been 9 months and the line is definitely softer. But the sensation in my lower lip still hasn't fully returned. This was explained before surgery so I'm accepting it.",
  },
  {
    id: "r012", source: "babitalk", clinicRaw: "미소플러스", procedureRaw: "윤곽",
    authorHandle: "sora_92", postedAt: "2026-03-30", statedPriceKrw: 7500000, monthsPostOp: 7,
    ko: "윤곽 750만원. 결과는 만족스러운데 입원실이 좁고 회복하는 동안 간호 인력이 부족해 보였어요. 수술 자체는 잘 됐다고 생각합니다.",
    en: "Contouring, 7.5 million won. I'm satisfied with the result, but the recovery room was cramped and nursing staff seemed short-handed during recovery. I think the surgery itself went well.",
  },
  {
    id: "r013", source: "naver_cafe", clinicRaw: "미소플러스의원 압구정", procedureRaw: "광대축소",
    authorHandle: "익명1102", postedAt: "2026-05-19", statedPriceKrw: 6800000, monthsPostOp: 4,
    ko: "광대축소 680만원 했습니다. 4개월차. 비대칭이 약간 있는 것 같아서 재진 갔더니 붓기라고 하시는데 저는 잘 모르겠어요. 좀 더 지켜보려고요.",
    en: "I had cheekbone reduction for 6.8 million won. 4 months in. I think there's slight asymmetry so I went back, and they said it's swelling, but I'm not sure. I'm going to watch it a bit longer.",
  },
  {
    id: "r014", source: "gangnam_unni", clinicRaw: "미소플러스 성형외과의원", procedureRaw: "V라인",
    authorHandle: "u_4410288", postedAt: "2026-02-08", statedPriceKrw: 9200000, monthsPostOp: 12,
    ko: "V라인 920만원. 1년 됐고 결과 아주 만족합니다. 다만 견적이 상담 때보다 올라갔어요. 처음엔 800만원대로 안내받았는데 수술 직전에 항목이 추가됐습니다.",
    en: "V-line, 9.2 million won. It's been a year and I'm very satisfied with the result. However the quote went up from the consultation. I was initially told it'd be in the 8 million range, but items were added right before surgery.",
  },
  {
    id: "r015", source: "naver_blog", clinicRaw: "미소플러스성형외과", procedureRaw: "윤곽수술",
    authorHandle: "gangnam_ad_kr", postedAt: "2026-04-22", statedPriceKrw: null, monthsPostOp: null,
    ko: "미소플러스성형외과 윤곽수술 후기! 미소플러스성형외과는 20년 경력의 미소플러스성형외과 대표원장님이 직접 집도합니다. 지금 미소플러스성형외과 이벤트 진행중! 상담문의 카톡 @misoplus 예약 서둘러주세요 ✨✨✨",
    en: "Miso Plus Plastic Surgery contouring review! At Miso Plus Plastic Surgery, the Miso Plus Plastic Surgery chief director with 20 years of experience operates personally. Miso Plus Plastic Surgery event running now! Consultation inquiries KakaoTalk @misoplus, hurry and book ✨✨✨",
  },
  {
    id: "r016", source: "babitalk", clinicRaw: "청담라온클리닉", procedureRaw: "울쎄라",
    authorHandle: "skin_note", postedAt: "2026-03-05", statedPriceKrw: 1200000, monthsPostOp: 2,
    ko: "울쎄라 300샷 120만원에 받았어요. 시술 중 통증은 있었지만 참을만 했고 2개월차에 턱선이 조금 올라온 느낌입니다. 드라마틱하진 않아요.",
    en: "I had Ulthera 300 shots for 1.2 million won. There was pain during the procedure but it was bearable, and at 2 months my jawline feels slightly lifted. It's not dramatic.",
  },
  {
    id: "r017", source: "gangnam_unni", clinicRaw: "라온클리닉", procedureRaw: "울쎄라 300샷",
    authorHandle: "u_7761920", postedAt: "2026-03-08", statedPriceKrw: 1200000, monthsPostOp: 2,
    ko: "울쎄라 300샷을 120만원에 받았습니다. 시술 중 통증이 있었지만 참을만 했고 2개월차에 턱선이 조금 올라온 느낌이에요. 드라마틱하지는 않습니다.",
    en: "I received Ulthera 300 shots for 1.2 million won. There was pain during the procedure but it was bearable, and at 2 months my jawline feels slightly lifted. It is not dramatic.",
  },
  {
    id: "r018", source: "naver_cafe", clinicRaw: "청담 라온", procedureRaw: "리쥬란",
    authorHandle: "익명5501", postedAt: "2026-04-14", statedPriceKrw: 450000, monthsPostOp: 1,
    ko: "리쥬란 3회 패키지 45만원. 가격은 착한데 시술하시는 분이 매번 바뀌어서 일관성이 없는 느낌이에요. 효과는 아직 잘 모르겠습니다.",
    en: "Rejuran 3-session package, 450,000 won. The price is reasonable but the person performing it changes every time so it feels inconsistent. I can't really tell the effect yet.",
  },
  {
    id: "r019", source: "naver_blog", clinicRaw: "라온의원", procedureRaw: "보톡스",
    authorHandle: "lifestyle_mk", postedAt: "2026-05-02", statedPriceKrw: 150000, monthsPostOp: 1,
    ko: "사각턱 보톡스 15만원에 맞았습니다. 한 달 정도 되니 확실히 턱이 갸름해졌어요. 다만 예약 없이 가면 대기가 아주 깁니다.",
    en: "I got masseter Botox for 150,000 won. After about a month my jaw is clearly slimmer. That said, if you go without a booking the wait is very long.",
  },
  {
    id: "r020", source: "naver_blog", clinicRaw: "더뷰티성형외과", procedureRaw: "코성형",
    authorHandle: "nose_journey", postedAt: "2026-01-15", statedPriceKrw: 3800000, monthsPostOp: 8,
    ko: "코성형 380만원에 했어요. 8개월차이고 실리콘 비침은 없습니다. 콧대는 자연스러운데 코끝이 생각보다 덜 올라갔어요. 원장님은 무리하지 않는 게 낫다고 하셨고 저도 동의합니다.",
    en: "I had rhinoplasty for 3.8 million won. I'm 8 months in and there's no silicone show-through. The bridge looks natural but the tip lifted less than I expected. The director said it's better not to overdo it and I agree.",
  },
  {
    id: "r021", source: "babitalk", clinicRaw: "THE BEAUTY 성형외과", procedureRaw: "코성형",
    authorHandle: "yuna_p", postedAt: "2026-02-26", statedPriceKrw: 4100000, monthsPostOp: 6,
    ko: "코 410만원. 6개월 지났고 결과는 무난합니다. 상담 때 3D 시뮬레이션 보여준 거랑 실제는 좀 달라요. 그래도 크게 불만은 없습니다.",
    en: "Nose, 4.1 million won. It's been 6 months and the result is decent. What they showed in the 3D simulation at consultation differs somewhat from reality. Still, no major complaints.",
  },
  {
    id: "r022", source: "gangnam_unni", clinicRaw: "더 뷰티 성형외과의원", procedureRaw: "쌍꺼풀 절개",
    authorHandle: "u_1093882", postedAt: "2026-04-03", statedPriceKrw: 2200000, monthsPostOp: 3,
    ko: "절개 쌍꺼풀 220만원. 3개월차. 흉터는 아직 붉지만 점점 나아지고 있어요. 수술 후 관리 프로그램이 체계적인 편입니다.",
    en: "Incisional double eyelid, 2.2 million won. 3 months in. The scar is still red but gradually improving. The post-op care programme is fairly systematic.",
  },
  {
    id: "r023", source: "naver_cafe", clinicRaw: "더뷰티", procedureRaw: "코성형",
    authorHandle: "익명7734", postedAt: "2026-05-28", statedPriceKrw: 3900000, monthsPostOp: 2,
    ko: "코 390만원 했는데 2개월차에 염증이 생겨서 재내원 중입니다. 병원에서는 대응은 빠르게 해주고 있어요. 추가 비용은 안 받으셨습니다. 결과는 아직 판단하기 이릅니다.",
    en: "I had my nose done for 3.9 million won but developed an infection at 2 months and am going back for treatment. The clinic is responding quickly. They didn't charge extra. It's too early to judge the result.",
  },
  {
    id: "r024", source: "naver_blog", clinicRaw: "더뷰티성형외과", procedureRaw: "코성형",
    authorHandle: "ad_partner_02", postedAt: "2026-03-18", statedPriceKrw: null, monthsPostOp: null,
    ko: "협찬을 받아 작성된 후기입니다. 더뷰티성형외과 코성형 정말 만족스러워요! 부작용 하나도 없고 통증도 전혀 없었어요. 100% 만족합니다. 강남에서 코성형 고민중이라면 무조건 여기로 가세요!!!",
    en: "This review was written with sponsorship. The Beauty Plastic Surgery rhinoplasty is really satisfying! Zero side effects and absolutely no pain at all. 100% satisfied. If you're considering rhinoplasty in Gangnam, go here no question!!!",
  },
  {
    id: "r025", source: "babitalk", clinicRaw: "한빛의원", procedureRaw: "실리프팅",
    authorHandle: "mira_choi", postedAt: "2026-02-11", statedPriceKrw: 1800000, monthsPostOp: 4,
    ko: "실리프팅 180만원. 4개월 됐는데 효과가 생각보다 빨리 사라지는 느낌이에요. 시술은 꼼꼼하게 해주셨습니다. 유지기간에 대한 설명이 좀 더 솔직했으면 좋겠어요.",
    en: "Thread lift, 1.8 million won. It's been 4 months and the effect feels like it's fading faster than expected. The procedure itself was done meticulously. I wish the explanation about how long it lasts had been more honest.",
  },
  {
    id: "r026", source: "naver_cafe", clinicRaw: "한빛성형외과", procedureRaw: "쌍꺼풀",
    authorHandle: "익명3320", postedAt: "2026-03-25", statedPriceKrw: 1400000, monthsPostOp: 6,
    ko: "쌍꺼풀 140만원에 했어요. 가격 대비 만족합니다. 6개월차고 자연스러워요. 병원이 크지는 않지만 원장님이 상담부터 수술까지 다 직접 하십니다.",
    en: "I had double eyelid surgery for 1.4 million won. Satisfied for the price. 6 months in and it looks natural. The clinic isn't large, but the director personally handles everything from consultation to surgery.",
  },
  {
    id: "r027", source: "gangnam_unni", clinicRaw: "한빛 의원 신사점", procedureRaw: "필러",
    authorHandle: "u_6620194", postedAt: "2026-05-11", statedPriceKrw: 600000, monthsPostOp: 1,
    ko: "턱 필러 1cc 60만원. 한 달차이고 자연스럽습니다. 다만 다른 곳보다 비싼 편인 것 같아요. 시술 자체는 아프지 않았어요.",
    en: "Chin filler 1cc, 600,000 won. One month in and it looks natural. That said, it seems pricier than other places. The procedure itself wasn't painful.",
  },
  {
    id: "r028", source: "naver_blog", clinicRaw: "한빛의원", procedureRaw: "쌍꺼풀",
    authorHandle: "seoul_lifelog", postedAt: "2026-04-28", statedPriceKrw: 1400000, monthsPostOp: 6,
    ko: "쌍꺼풀 140만원에 했습니다. 가격 대비 만족해요. 6개월차이고 자연스럽습니다. 병원이 크지는 않지만 원장님이 상담부터 수술까지 전부 직접 하세요.",
    en: "I had double eyelid surgery for 1.4 million won. Satisfied for the price. 6 months in and it looks natural. The clinic isn't large, but the director personally handles everything from consultation through surgery.",
  },
  {
    id: "r029", source: "naver_cafe", clinicRaw: "라인성형외과의원", procedureRaw: "코성형",
    authorHandle: "익명9987", postedAt: "2026-05-30", statedPriceKrw: 4400000, monthsPostOp: 3,
    ko: "코 440만원. 3개월차입니다. 붓기는 거의 빠졌고 모양은 마음에 들어요. 근데 수술 동의서에 집도의가 특정되지 않아서 물어봤더니 명확한 답을 안 주셨어요. 그 부분은 아쉽습니다.",
    en: "Nose, 4.4 million won. I'm 3 months in. The swelling has mostly gone and I like the shape. But the consent form didn't specify the operating surgeon, and when I asked I didn't get a clear answer. That part was disappointing.",
  },
  {
    id: "r030", source: "babitalk", clinicRaw: "예담의원", procedureRaw: "코성형",
    authorHandle: "cloud_9_k", postedAt: "2026-05-15", statedPriceKrw: 4600000, monthsPostOp: 5,
    ko: "코성형 460만원. 5개월차고 결과는 좋습니다. 가격이 강남 평균보다 높은 편이지만 사후관리가 확실해서 납득이 갑니다. 원장님이 꼼꼼하세요.",
    en: "Rhinoplasty, 4.6 million won. 5 months in and the result is good. The price is above the Gangnam average but the aftercare is solid so it makes sense to me. The director is thorough.",
  },
];
