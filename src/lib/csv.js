// CSV helpers
export const COL_MAP={
  // Part info
  "hissə adı":"partName","наименование товара":"partName","наименование":"partName","part name":"partName","name":"partName","ad":"partName","mal adı":"partName",
  "hissə növü":"partType","part type":"partType","категория":"partType","növ":"partType","kateqoriya":"partType",
  "vəziyyət":"condition","состояние":"condition","condition":"condition","hal":"condition",
  // Manufacturer — exact template column names + variants
  "istehsalçı marka":"manufacturerBrand","istehsalci marka":"manufacturerBrand","istehsalçı":"manufacturerBrand","manufacturer":"manufacturerBrand","бренд":"manufacturerBrand","brend":"manufacturerBrand","istehsalçı brand":"manufacturerBrand",
  "istehsalçı ölkə":"manufacturerCountry","ölkə":"manufacturerCountry","country":"manufacturerCountry","страна":"manufacturerCountry","istehsalci ölkə":"manufacturerCountry","istehsal ölkəsi":"manufacturerCountry",
  "mühərrik":"engine","двигатель":"engine","engine":"engine","muhərrik":"engine","motor həcmi":"engine",
  // Compatibility — exact template names + variants
  "avtomobil markaları":"compatMakes","автомобиль марка":"compatMakes","марка":"compatMakes","brand":"compatMakes","marka":"compatMakes","avtomobil marka":"compatMakes","maşın markası":"compatMakes","make":"compatMakes",
  "avtomobil modelləri":"compatModels","автомобиль модель":"compatModels","модель":"compatModels","model":"compatModels","avtomobil model":"compatModels","maşın modeli":"compatModels",
  "ildən":"yearFrom","год от":"yearFrom","year from":"yearFrom","il (başlanğıc)":"yearFrom","başlanğıc il":"yearFrom","from year":"yearFrom",
  "ilə qədər":"yearTo","год до":"yearTo","year to":"yearTo","il (son)":"yearTo","son il":"yearTo","to year":"yearTo",
  "год":"yearFrom","il":"yearFrom",
  // Pricing
  "qiymət":"price","цена":"price","цена azn":"price","price":"price","qiymet":"price","məbləğ":"price",
  "mövcudluq":"availability","наличие":"availability","остаток":"availability","availability":"availability","stok":"availability","var/yox":"availability",
  // Notes
  "qeydlər":"notes","примечания":"notes","notes":"notes","qeyd":"notes","açıqlama":"notes",
  // Ignore
  "марка/модель/год":null,"sku":null,"kod":"null","код поставщика":null,"supplier code":null,
};
export const CANON_LABELS={
  partName:"Hissə adı",partType:"Hissə növü",condition:"Vəziyyət",
  manufacturerBrand:"İstehsalçı marka",manufacturerCountry:"İstehsalçı ölkə",engine:"Mühərrik",
  compatMakes:"Avtomobil markaları",compatModels:"Avtomobil modelləri",
  yearFrom:"İldən",yearTo:"İlə qədər",
  price:"Qiymət",availability:"Mövcudluq",notes:"Qeydlər",
  brand:"Marka",model:"Model",year:"İl", // legacy
};
export function normalizeHeader(h){
  // Azerbaijani İ lowercases to i + combining dot (U+0307), not plain i
  // Replace all variants of dotted-I with plain i for COL_MAP lookup
  return h.toLowerCase().replace(/i\u0307/g,"i").replace(/\u0130/g,"i").trim();
}
export function inferCols(headers){return headers.map(h=>{const low=normalizeHeader(h),inf=COL_MAP[low];return{original:h,inferred:inf!==undefined?(inf===null?"ignore":inf):"ignore",confidence:inf===null?"warn":inf!==undefined?"ok":"warn"};});}
export function normalizeRows(rows,mappings){
  // Step 1: parse each raw row
  const parsed=rows.slice(0,200).map((row,i)=>{
    const obj={};
    mappings.forEach(m=>{if(m.inferred&&m.inferred!=="ignore")obj[m.inferred]=row[m.original]||null;});
    // Parse price — strip currency symbols and text
    if(obj.price) obj.price=String(obj.price).replace(/[^\d.]/g,"").trim()||null;
    // Normalise availability
    if(obj.availability){
      const av=String(obj.availability).toLowerCase().trim();
      obj.availability=["var","есть","in_stock","1","bəli","yes"].includes(av)?"in_stock":"on_order";
    }
    // Single compat entry from this row
    const make=(obj.compatMakes||obj.brand||"").trim();
    const model=(obj.compatModels||obj.model||"").trim();
    const yearFrom=obj.yearFrom?Number(String(obj.yearFrom).replace(/\D/g,""))||null:null;
    const yearTo=obj.yearTo?Number(String(obj.yearTo).replace(/\D/g,""))||null:null;
    obj._compatEntry=(make||model)?{make,model,yearFrom,yearTo}:null;
    return{...obj,_rawIdx:i};
  }).filter(row=>Object.values(row).some(v=>v&&v!==""&&v!==null));

  // Step 2: group rows with same name+price into one product (multi-compat)
  const grouped=[];
  const seen={};
  for(const row of parsed){
    const key=(row.partName||"")+"||"+(row.price||"");
    const cleanName=(row.partName||"").trim();
    if(!cleanName||cleanName.length<2){continue;}
    row.partName=cleanName;
    if(seen[key]!==undefined){
      // Append compat entry to existing product
      if(row._compatEntry) grouped[seen[key]].compatibility.push(row._compatEntry);
    } else {
      seen[key]=grouped.length;
      const compat=row._compatEntry?[row._compatEntry]:[];
      let status="ok",issue="Bütün sahələr xəritələndi";
      if(!row.price){status="warn";issue="Qiymət tapılmadı";}
      else if(compat.length===0){status="warn";issue="Avtomobil uyğunluğu qeyri-müəyyəndir";}
      grouped.push({...row,compatibility:compat,_id:grouped.length,_status:status,_issue:issue});
    }
  }
  return grouped.slice(0,100);
}
