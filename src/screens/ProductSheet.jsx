import { useState, useEffect } from "react";
import { db, increment } from "../firebase.js";
import { gaEvent } from "../analytics.js";
import { AZ } from "../i18n.js";
import Icon from "../components/Icon.jsx";

// ── PRODUCT SHEET ──
export default function ProductSheet({product,seller,onClose,onContact}){
  const [open,setOpen]=useState(false);
  useEffect(()=>{setTimeout(()=>setOpen(true),10);return()=>document.body.classList.remove("sheet-open");},[]);
  useEffect(()=>{open?document.body.classList.add("sheet-open"):document.body.classList.remove("sheet-open");},[open]);
  const close=()=>{setOpen(false);setTimeout(onClose,360);};
  const s=seller||{};

  const trackContact=(type)=>{
    if(!product?.sellerId) return;
    gaEvent("contact",{method:type==="contacts"?"whatsapp":"phone",item_name:product?.name||""});
    const today=new Date().toISOString().slice(0,10);
    const ref=db.collection("sellers").doc(product.sellerId).collection("events").doc(today);
    ref.set({[type]:increment(1)},{merge:true});
    if(onContact) onContact();
  };

  // Build compatibility string
  const compatLines = product.compatibility && product.compatibility.length > 0
    ? product.compatibility.map(e=>[e.make,e.model,e.yearFrom&&e.yearTo?`${e.yearFrom}–${e.yearTo}`:e.yearFrom||e.yearTo||""].filter(Boolean).join(" ")).join("\n")
    : product.brand ? [product.brand,product.model,product.yearFrom&&product.yearTo?`${product.yearFrom}–${product.yearTo}`:""].filter(Boolean).join(" ") : null;

  const fields=[
    {label:"Qiymət",value:product.price!=null?`₼ ${product.price}`:AZ.callForPrice,cls:product.price!=null?"big":"muted"},
    {label:"Vəziyyət",value:product.condition||"—"},
    product.manufacturerBrand&&{label:"İstehsalçı",value:product.manufacturerBrand+(product.manufacturerCountry?" · "+product.manufacturerCountry:"")},
    product.engine&&{label:"Mühərrik",value:product.engine},
    compatLines&&{label:"Uyğunluq",value:compatLines,multiline:true},
    {label:"Mövcudluq",value:product.availability==="in_stock"?AZ.inStock:AZ.onOrder,cls:product.availability==="in_stock"?"green":""},
    product.notes&&{label:"Qeydlər",value:product.notes},
  ].filter(Boolean);

  return(
    <>
      <div className={`sheet-overlay ${open?"open":""}`} onClick={close}/>
      <div className={`sheet ${open?"open":""}`}>
        <div className="sheet-toprow">
          <span className="sheet-cat">{product.partType||""}</span>
          <button className="sheet-close" onClick={close}><Icon name="x" size={13} color="var(--g700)" strokeWidth={2.5}/></button>
        </div>
        <div className="sheet-body">
          <div className="sheet-title">{product.name}</div>
          <div className="field-table">
            {fields.map(f=>(
              <div key={f.label} className={`field-row${f.multiline?" field-row-top":""}`}>
                <span className="field-lbl">{f.label}</span>
                {f.multiline
                  ? <span className={`field-val ${f.cls||""}`} style={{whiteSpace:"pre-line",textAlign:"right"}}>{f.value}</span>
                  : <span className={`field-val ${f.cls||""}`}>{f.value}</span>
                }
              </div>
            ))}
          </div>
          {s.shopName&&(
            <div className="seller-box">
              <div className="seller-box-name"><div className="dot-live"/>{s.shopName}</div>
              <div className="seller-box-meta">{s.city}</div>
            </div>
          )}
          <div className="cta-wrap">
            {s.whatsapp&&(
              <a href={`https://wa.me/${s.whatsapp.replace(/\D/g,"")}`} style={{textDecoration:"none"}} onClick={()=>trackContact("contacts")}>
                <button className="cta-btn"><Icon name="whatsapp" size={17} color="white"/>WhatsApp</button>
              </a>
            )}
            {s.phone&&(
              <a href={`tel:${s.phone}`} style={{textDecoration:"none"}} onClick={()=>trackContact("contacts")}>
                <button className="cta-btn secondary"><Icon name="phone" size={15} strokeWidth={2}/>{s.phone}</button>
              </a>
            )}
            {s.email&&!s.whatsapp&&(
              <a href={`mailto:${s.email}`} style={{textDecoration:"none"}} onClick={()=>trackContact("contacts")}>
                <button className="cta-btn secondary"><Icon name="mail" size={15}/>{s.email}</button>
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
