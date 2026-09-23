import { useState } from "react";
import { db, serverTimestamp } from "../firebase.js";
import { AZ } from "../i18n.js";
import { CANON_LABELS } from "../lib/csv.js";
import Icon from "../components/Icon.jsx";

// ── REVIEW ──
export default function ReviewScreen({data,seller,onBack,onPublish}){
  const [tab,setTab]=useState("all");
  const [mappings,setMappings]=useState(data.mappings);
  const [publishing,setPublishing]=useState(false);
  const rows=data.rows;
  const ok=rows.filter(r=>r._status==="ok"),warn=rows.filter(r=>r._status==="warn"),err=rows.filter(r=>r._status==="err");
  const display=tab==="all"?rows:tab==="warn"?warn:err;
  const opts=["partName","partType","condition","manufacturerBrand","manufacturerCountry","engine","compatMakes","compatModels","yearFrom","yearTo","price","availability","notes","ignore"];
  const upd=(i,val)=>setMappings(m=>m.map((item,idx)=>idx===i?{...item,inferred:val,confidence:"ok"}:item));

  const handlePublish=async()=>{
    setPublishing(true);
    const region=seller.city==="Bakı"?"baku":seller.city==="Naxçıvan"?"nakh":seller.city==="Gəncə"?"ganja":"other";
    const batch=db.batch();
    const readyRows=[...ok,...warn].filter(r=>r._status!=="err");
    readyRows.forEach(row=>{
      const ref=db.collection("products").doc();
      const compat=row.compatibility||[];
      batch.set(ref,{
        name:row.partName||"",
        partType:row.partType||"",
        condition:row.condition||AZ.condNew,
        manufacturerBrand:row.manufacturerBrand||"",
        manufacturerCountry:row.manufacturerCountry||"",
        engine:row.engine||"",
        compatibility:compat,
        // Legacy flat fields from first compat entry
        brand:compat[0]?.make||"",
        model:compat[0]?.model||"",
        yearFrom:compat[0]?.yearFrom||null,
        yearTo:compat[0]?.yearTo||null,
        price:row.price?Number(row.price):null,
        availability:row.availability==="var"||row.availability==="in_stock"?"in_stock":"on_order",
        notes:row.notes||"",
        status:"live",sellerId:seller.uid,region,
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp(),
      });
    });
    await batch.commit();
    await db.collection("sellers").doc(seller.uid).update({lastUpload:serverTimestamp()});
    setPublishing(false);
    const now=new Date();
    onPublish(readyRows.length, now);
  };

  return(
    <div>
      <div className="review-header">
        <button className="back-btn" onClick={onBack}><Icon name="arrowLeft" size={14} strokeWidth={2}/> {AZ.back}</button>
        <div className="review-title">{AZ.reviewTitle}</div>
        <div className="summary-pills">
          <span className="pill pill-ok">✓ {ok.length} {AZ.ready}</span>
          {warn.length>0&&<span className="pill pill-warn">⚠ {warn.length} {AZ.uncertain}</span>}
          {err.length>0&&<span className="pill pill-err">✕ {err.length} {AZ.failed}</span>}
        </div>
      </div>
      <div className="mapping-section">
        <div className="section-label" style={{marginBottom:10}}>{AZ.columnMapping}</div>
        <div className="mapping-grid">
          {mappings.map((m,i)=>(
            <div key={i} className="mapping-row">
              <div className="m-orig" title={m.original}>{m.original}</div>
              <div className="m-arrow">→</div>
              <select style={{fontFamily:"var(--font-b)",fontSize:12,fontWeight:500,background:m.confidence==="ok"?"var(--green-bg)":"var(--amber-bg)",color:m.confidence==="ok"?"var(--green)":"var(--amber)",border:"none",borderRadius:6,padding:"5px 8px",cursor:"pointer",width:"100%"}} value={m.inferred||"ignore"} onChange={e=>upd(i,e.target.value)}>
                {opts.map(o=><option key={o} value={o}>{CANON_LABELS[o]||(o==="ignore"?"İqnor et":o)}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div className="review-tabs">
        <button className={`rtab ${tab==="all"?"active":""}`} onClick={()=>setTab("all")}>{AZ.allRows} ({rows.length})</button>
        {warn.length>0&&<button className={`rtab ${tab==="warn"?"active":""}`} onClick={()=>setTab("warn")}>{AZ.uncertainRows} ({warn.length})</button>}
        {err.length>0&&<button className={`rtab ${tab==="err"?"active":""}`} onClick={()=>setTab("err")}>{AZ.failedRows} ({err.length})</button>}
      </div>
      <div>
        {display.map((row,i)=>(
          <div key={i} className={`review-row ${row._status!=="ok"?row._status:""}`}>
            <div><div className="rr-name">{row.partName||<em style={{color:"var(--g400)"}}>Ad yoxdur</em>}</div><div className={`rr-issue ${row._status}`}>{row._issue}</div></div>
            <div className="rr-price">{row.price?`₼ ${row.price}`:<span style={{color:"var(--g400)"}}>—</span>}</div>
            <div style={{display:"flex",justifyContent:"flex-end"}}><div className={`status-circle sc-${row._status}`}/></div>
          </div>
        ))}
      </div>
      <div className="review-footer">
        <button className="btn btn-secondary" style={{flex:1}} onClick={onBack}>{AZ.saveDrafts}</button>
        <button className="btn btn-primary" style={{flex:2}} onClick={handlePublish} disabled={publishing}>
          {publishing?<span className="loading-dots">Dərc edilir</span>:`${ok.length+warn.length} ${AZ.publishRows} →`}
        </button>
      </div>
    </div>
  );
}
