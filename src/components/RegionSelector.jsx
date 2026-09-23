import { useEffect, useRef } from "react";
import { buildRegions } from "../lib/regions.js";

// ── REGION SELECTOR ──
export default function RegionSelector({region,onChange,sellerCities}){
  const regions=buildRegions(sellerCities||[]);
  const cur=regions.find(r=>r.id===region)||regions[0];
  const label=cur.label+(cur.soon?" · tezliklə":"");
  const sizerRef=useRef();
  const selectRef=useRef();
  useEffect(()=>{
    if(sizerRef.current&&selectRef.current){
      selectRef.current.style.width=sizerRef.current.offsetWidth+"px";
    }
  },[label]);
  return(
    <div className="region-wrap">
      <span className="region-sizer" ref={sizerRef} aria-hidden="true">{label}</span>
      <select className="region-select" ref={selectRef} value={region} onChange={e=>onChange(e.target.value)}>
        {regions.map(r=>(
          <option key={r.id} value={r.id}>{r.label}{r.soon?" · tezliklə":""}</option>
        ))}
      </select>
      <span className="region-caret">▾</span>
    </div>
  );
}
