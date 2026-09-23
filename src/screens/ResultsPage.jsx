import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { gaEvent } from "../analytics.js";
import { AZ } from "../i18n.js";
import { parseQuery, scoreProduct } from "../lib/search.js";
import Icon from "../components/Icon.jsx";
import Spinner from "../components/Spinner.jsx";
import ErrorScreen from "../components/ErrorScreen.jsx";

// ── RESULTS ──
export default function ResultsPage({query,region,onBack,onProduct,onContact}){
  const [params,setParams]=useState(()=>parseQuery(query));
  const [allProducts,setAllProducts]=useState([]);
  const [sellers,setSellers]=useState({});
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState(null);

  useEffect(()=>{
    // Load active products from Firestore
    // Query all live products, filter by region client-side
    // (avoids Firestore composite index requirement and fixes legacy docs without region field)
    let q2=db.collection("products").where("status","==","live");
    return q2.onSnapshot(snap=>{
      const prods=snap.docs.map(d=>({id:d.id,...d.data()}));
      setAllProducts(prods);
      // Load seller info for these products
      const sellerIds=[...new Set(prods.map(p=>p.sellerId).filter(Boolean))];
      sellerIds.forEach(sid=>{
        db.collection("sellers").doc(sid).get().then(d=>{
          if(d.exists) setSellers(s=>({...s,[sid]:{id:sid,...d.data()}}));
        });
      });
      setLoading(false);
    },()=>{setLoading(false);setLoadError("Məhsullar yüklənmədi. İnternet bağlıntınızı yoxlayın.");});
  },[region]);

  const results = allProducts
    .map(p=>({...p,_score:scoreProduct(p,params,query)}))
    .filter(p=>{
      if(p._score<1) return false;
      if(region==="all") return true;
      // For dynamic city keys, match against seller's city
      if(region.startsWith("city_")){
        const cityLabel=region.replace("city_","").replace(/_/g," ");
        const sellerCity=(sellers[p.sellerId]||{}).city||"";
        return sellerCity.toLowerCase()===cityLabel.toLowerCase();
      }
      // For known region keys (baku/ganja/nakh), match p.region
      // Products with region="other" do NOT match known regions — only show under "all" or their city
      return (p.region||"other")===region;
    })
    .sort((a,b)=>{
      if(a.availability!==b.availability) return a.availability==="in_stock"?-1:1;
      return (a.price||9999)-(b.price||9999);
    });

  const removeParam=k=>setParams(p=>({...p,[k]:null}));
  const pLabels={brand:AZ.paramBrand,model:AZ.paramModel,year:AZ.paramYear,engine:AZ.paramEngine,partType:AZ.paramPart};
  const active=Object.entries(params).filter(([,v])=>v!==null);

  return(
    <div>
      <div className="results-header">
        <button className="back-btn" onClick={onBack}><Icon name="arrowLeft" size={14} strokeWidth={2}/> {AZ.back}</button>
        <div className="results-title">{params.partType||"Hissələr"}{params.brand?` · ${params.brand}`:""}{params.model?` ${params.model}`:""}</div>
        <div className="param-chips">
          {active.map(([k,v])=>(
            <button key={k} className="param-chip" onClick={()=>removeParam(k)}>
              <span style={{color:"var(--g400)",marginRight:2}}>{pLabels[k]}</span>{String(v)}<span className="chip-x">×</span>
            </button>
          ))}
        </div>
      </div>
      {loadError?<ErrorScreen message={loadError} onRetry={()=>window.location.reload()}/>:loading?<Spinner/>:<>
        <div className="results-content"><div className="results-meta">{results.length===0?"Nəticə tapılmadı":`${results.length} ${AZ.listingsFound}`}</div>
        {results.length===0?(
          <div className="no-results"><div className="no-results-icon">🔍</div><h3>{AZ.noResults}</h3><p>{AZ.noResultsSub}</p></div>
        ):results.map(p=>{
          const s=sellers[p.sellerId]||{};
          return(
            <div key={p.id} className="result-item" onClick={()=>{onProduct(p,s);gaEvent("view_item",{item_id:p.id,item_name:p.name,item_category:p.partType||"",price:p.price||0});}}>
              <div className="result-left">
                <div className="result-name">{p.name}</div>
                <div className="result-sub">{s.shopName||"—"} · {s.city||""}</div>
              </div>
              <div className="result-right">
                {p.price?<div className="result-price">₼ {p.price}</div>:<div className="result-price no-price">{AZ.callForPrice}</div>}
                <div className="avail"><div className={`avail-dot ${p.availability==="in_stock"?"green":"grey"}`}/>{p.availability==="in_stock"?AZ.inStock:AZ.onOrder}</div>
              </div>
            </div>
          );
        })}
        </div>{/* results-content */}
      </>}
    </div>
  );
}
