import { CAR_DB, CAR_MAKES } from "../data/cars.js";

// ── QUERY PARSER (client-side) ──
const BRAND_MAP={"peugeot":"Peugeot","pejo":"Peugeot","lada":"Lada","vaz":"VAZ","toyota":"Toyota","hyundai":"Hyundai","bmw":"BMW","mercedes":"Mercedes","ford":"Ford","opel":"Opel","volkswagen":"Volkswagen","vw":"Volkswagen","kia":"KIA","honda":"Honda","nissan":"Nissan","chevrolet":"Chevrolet"};
const MODEL_MAP={"308":"308","207":"207","206":"206","2008":"2008","granta":"Granta","priora":"Priora","camry":"Camry","corolla":"Corolla","yaris":"Yaris","accent":"Accent","tucson":"Tucson","elantra":"Elantra","golf":"Golf","passat":"Passat","polo":"Polo","focus":"Focus","2107":"2107","2106":"2106"};
const PART_MAP={"radiator":"Radiator","radyator":"Radiator","alternator":"Alternator","generator":"Alternator","генератор":"Alternator","tormoz":"Tormoz bəndi","brake":"Tormoz bəndi","колодки":"Tormoz bəndi","yağ filteri":"Yağ filteri","oil filter":"Yağ filteri","amortizator":"Amortizator","shock":"Amortizator","амортизатор":"Amortizator","vaxt kəməri":"Vaxt kəməri","timing":"Vaxt kəməri","su pompası":"Su pompası","pompa":"Su pompası","starter":"Starter motor","mühərrik":"Digər","motor":"Digər","двигатель":"Digər","mator":"Digər","sükan":"Digər","transmissiya":"Digər","КПП":"Digər","şüşə":"Digər","bamper":"Digər","фара":"Digər","stoplar":"Digər"};

export function parseQuery(raw){
  const q=raw.toLowerCase().trim(),tokens=q.split(/[\s,\-\/]+/);
  const p={brand:null,model:null,year:null,engine:null,partType:null};
  for(const a of Object.keys(PART_MAP).sort((a,b)=>b.length-a.length)){if(q.includes(a)){p.partType=PART_MAP[a];break;}}
  // Match brand from CAR_DB keys
  for(const make of CAR_MAKES){
    if(q.includes(make.toLowerCase())){p.brand=make;break;}
  }
  // Fallback to legacy BRAND_MAP
  if(!p.brand){for(const t of tokens){if(BRAND_MAP[t]){p.brand=BRAND_MAP[t];break;}}}
  // Match model from CAR_DB
  if(p.brand && CAR_DB[p.brand]){
    for(const model of CAR_DB[p.brand]){
      if(q.includes(model.toLowerCase())){p.model=model;break;}
    }
  }
  if(!p.model){for(const t of tokens){if(MODEL_MAP[t]){p.model=MODEL_MAP[t];break;}}}
  const yr=q.match(/\b(19[5-9]\d|20[0-2]\d)\b/);if(yr)p.year=parseInt(yr[1]);
  const eng=q.match(/\b(\d+\.\d+)\b/);if(eng)p.engine=eng[1];
  return p;
}

// Score a product against parsed query params
export function scoreProduct(p, params, rawQuery) {
  const compat = p.compatibility && p.compatibility.length > 0 ? p.compatibility : null;

  // ── Compatibility score: best matching entry wins ──
  let compatScore = 0;
  let brandMatched = false;
  let modelMatched = false;

  if(compat){
    for(const entry of compat){
      let es = 0;
      const bm = params.brand && entry.make === params.brand;
      const mm = params.model && entry.model === params.model;
      const ym = params.year && entry.yearFrom && entry.yearTo && params.year >= entry.yearFrom && params.year <= entry.yearTo;
      if(bm) es += 2;
      if(mm) es += 2;
      if(ym) es += 1;
      if(es > compatScore){
        compatScore = es;
        if(bm) brandMatched = true;
        if(mm) modelMatched = true;
      }
    }
  } else {
    // Legacy flat fields
    const bm = params.brand && p.brand === params.brand;
    const mm = params.model && p.model === params.model;
    const ym = params.year && p.yearFrom && p.yearTo && params.year >= p.yearFrom && params.year <= p.yearTo;
    if(bm){ compatScore += 2; brandMatched = true; }
    if(mm){ compatScore += 2; modelMatched = true; }
    if(ym) compatScore += 1;
  }

  // ── Hard filters: if query specifies brand/model, product MUST match them ──
  // This prevents "Peugeot 308 Radiator" from returning Hyundai radiators
  if(params.brand && !brandMatched) return 0;
  if(params.model && !modelMatched) return 0;

  // ── Part type score — hard filter if partType specified ──
  let score = compatScore;
  if(params.partType){
    if(p.partType !== params.partType) return 0; // must match exactly
    score += 3;
  }
  if(params.engine && p.engine && p.engine.includes(params.engine)) score += 1;

  // ── Minimum: need at least one signal to show ──
  // If query has no brand/model/partType parsed, fall back to name search
  const hasStructuredParams = params.brand || params.model || params.partType;
  if(!hasStructuredParams && rawQuery){
    const tokens = rawQuery.toLowerCase().split(/[\s,\-\/]+/).filter(t => t.length > 2);
    const compatText = compat
      ? compat.map(e => [e.make, e.model].filter(Boolean).join(" ")).join(" ")
      : [p.brand, p.model].filter(Boolean).join(" ");
    const haystack = [p.name, p.partType, compatText].filter(Boolean).join(" ").toLowerCase();
    // Require at least 2 tokens to match, or 1 token that matches the product name directly
    const matchCount = tokens.filter(t => haystack.includes(t)).length;
    if(matchCount === 0) return 0;
    if(tokens.length === 1) return matchCount > 0 ? 1 : 0;
    return matchCount >= Math.min(2, tokens.length) ? 1 : 0;
  }

  // Name-based boost: if product name contains a query token, add 1
  if(rawQuery && score > 0){
    const tokens = rawQuery.toLowerCase().split(/[\s,\-\/]+/).filter(t => t.length > 2);
    const haystack = [p.name, p.partType].filter(Boolean).join(" ").toLowerCase();
    if(tokens.some(t => haystack.includes(t))) score += 1;
  }

  return score;
}
