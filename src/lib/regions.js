export const AZ_CITIES = ["Bakı","Gəncə","Sumqayıt","Mingəçevir","Naxçıvan","Lənkəran","Şirvan","Şəki","Yevlax","Xankəndi","Bərdə","Salyan","Masallı","Quba","Zaqatala"];

// Build region list from live seller cities
// Cities with sellers shown normally; known cities without sellers shown as "tezliklə"; unknown cities added dynamically
export function buildRegions(sellerCities){
  const citySet = new Set(sellerCities);
  const hasCity = city => citySet.has(city);

  const list = [
    {id:"all", label:"Bütün Azərbaycan"},
    {id:"baku", label:"Bakı", soon:!hasCity("Bakı")},
    {id:"ganja", label:"Gəncə", soon:!hasCity("Gəncə")},
    {id:"nakh", label:"Naxçıvan", soon:!hasCity("Naxçıvan")},
  ];

  // Add any city not covered by known regions
  sellerCities.forEach(city=>{
    if(!["Bakı","Gəncə","Naxçıvan"].includes(city)){
      const id="city_"+city.toLowerCase().replace(/[\s-]/g,"_");
      if(!list.find(r=>r.id===id)) list.push({id, label:city, soon:false});
    }
  });
  return list;
}

// Derive Firestore region key from city name
export function cityToRegion(city) {
  if (!city) return "other";
  const c = city.trim();
  if (c === "Bakı") return "baku";
  if (c === "Naxçıvan") return "nakh";
  if (c === "Gəncə") return "ganja";
  return "other";
}
