import { useState } from "react";
import { AZ } from "../i18n.js";
import SearchTextarea from "../components/SearchTextarea.jsx";

// ── BUYER HOME ──
export default function BuyerHome({onSearch,onSellerLogin,sellerCities,region,onRegion}){
  const [q,setQ]=useState("");
  const presets=["Radiator Peugeot 308 2016","Tormoz bəndi Toyota Camry","Yağ filteri Hyundai Accent"];
  const totalOnline=(sellerCities||[]).length;
  return(
    <div className="home-wrap">
      <div className="home-headline">{AZ.headline1}<br/><em>{AZ.headline2}</em></div>
      <SearchTextarea value={q} onChange={setQ} onSubmit={()=>{if(q.trim())onSearch(q.trim());}} placeholder={AZ.searchPlaceholder}/>
      <div className="search-hint">{AZ.searchHint}</div>
      <div className="section-label">{AZ.tryThese}</div>
      <div className="chip-row">{presets.map(p=><button key={p} className="chip" onClick={()=>onSearch(p)}>{p}</button>)}</div>
      <div className="home-footer">
        <button className="text-link" onClick={onSellerLogin}>{AZ.sellerLogin} →</button>
        <div className="online-badge"><div className="dot-live"/><span>{totalOnline} {AZ.sellersOnline}</span></div>
      </div>
    </div>
  );
}
