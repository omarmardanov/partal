import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { AZ } from "../i18n.js";
import { formatDateAZ } from "../lib/format.js";
import Icon from "../components/Icon.jsx";
import Spinner from "../components/Spinner.jsx";

// ── DASHBOARD ──
export default function Dashboard({seller,onAdd,onEdit,onUpload,onSettings}){
  const [products,setProducts]=useState([]);
  const [todayStats,setTodayStats]=useState({views:0,contacts:0});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!seller?.uid) return;
    // Real-time products listener
    const unsub=db.collection("products").where("sellerId","==",seller.uid)
      .onSnapshot(snap=>{setProducts(snap.docs.map(d=>({id:d.id,...d.data()})));setLoading(false);},()=>setLoading(false));
    // Load today's stats
    const today=new Date().toISOString().slice(0,10);
    db.collection("sellers").doc(seller.uid).collection("events").doc(today).get()
      .then(d=>{if(d.exists)setTodayStats({views:d.data().views||0,contacts:d.data().contacts||0});});
    return unsub;
  },[seller?.uid]);

  const live=products.filter(p=>p.status==="live").length;
  const draft=products.filter(p=>p.status==="draft").length;
  const lastUploadStr=seller?.lastUpload?formatDateAZ(seller.lastUpload.toDate?seller.lastUpload.toDate():seller.lastUpload):AZ.neverUploaded;

  return(
    <div className="dash-wrap">
      <div className="dash-toprow">
        <div className="dash-shop-name"><div className="dot-sm"/>{seller?.shopName||"Mağazam"}</div>
        <button className="icon-btn" onClick={onSettings}><Icon name="settings" size={15} strokeWidth={1.8}/></button>
      </div>
      <div className="dash-update-row">
        <div className="dash-update-label">{AZ.lastUploadLabel}</div>
        <div className="dash-update-val">{lastUploadStr}</div>
      </div>
      <div className="stats-row">
        <div className="stat"><div className="stat-num">{products.length}</div><div className="stat-lbl">{AZ.totalListings}</div></div>
        <div className="stat"><div className="stat-num">{live}</div><div className="stat-lbl">{AZ.liveListings}</div></div>
        <div className="stat"><div className="stat-num">{draft}</div><div className="stat-lbl">{AZ.draftListings}</div></div>
      </div>
      <div className="action-row">
        <button className="act-btn primary" onClick={onAdd}>{AZ.addProduct}<sub>{AZ.addProductSub}</sub></button>
        <button className="act-btn secondary" onClick={onUpload}>{AZ.uploadFile}<sub>{AZ.uploadFileSub}</sub></button>
      </div>
      <div className="section-label" style={{marginBottom:12}}>{AZ.yourListings}</div>
      {loading?<Spinner/>:(
        <div className="inv-table">
          <div className="inv-table-head"><div className="th">{AZ.partName}</div><div className="th right">{AZ.price}</div><div className="th right th-status">Status</div></div>
          {products.length===0?(<div className="empty-state"><p>Hələ məhsul yoxdur.<br/>Yuxarıda əlavə edin.</p></div>):products.map(p=>{
            const cs=p.compatibility&&p.compatibility[0]?[p.compatibility[0].make,p.compatibility[0].model].filter(Boolean).join(" · "):(p.brand&&p.model?p.brand+" · "+p.model:null);
            const bdg=<span className={`badge ${p.status==="draft"?"badge-draft":"badge-live"}`}>{p.status==="draft"?AZ.draft:AZ.live}</span>;
            return(
            <div key={p.id} className="inv-table-row" onClick={()=>onEdit(p)}>
              <div className="td-name-wrap">
                <div className="td-name">{p.name}</div>
                <div className="td-sub">{cs||"Məlumat yoxdur"}<span className="td-sub-status"> · {p.status==="draft"?AZ.draft:AZ.live}</span></div>
              </div>
              <div className={`td-price ${!p.price?"na":""}`}>{p.price?`₼ ${p.price}`:"—"}</div>
              <div className="td-status">{bdg}</div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}
