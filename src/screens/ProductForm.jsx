import { useState, useRef } from "react";
import { db, serverTimestamp } from "../firebase.js";
import { AZ } from "../i18n.js";
import { CAR_DB, CAR_MAKES, YEAR_OPTIONS } from "../data/cars.js";
import { cityToRegion } from "../lib/regions.js";
import Icon from "../components/Icon.jsx";

// ── PRODUCT FORM ──
function CompatRow({entry, index, onChange, onRemove, showRemove}){
  const models = entry.make && CAR_DB[entry.make] ? CAR_DB[entry.make] : [];
  return(
    <div style={{background:"var(--g50)",border:"1px solid var(--g200)",borderRadius:"var(--r-sm)",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:"var(--g500)"}}>Avtomobil {index+1}</span>
        {showRemove&&<button onClick={()=>onRemove(index)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--g400)",fontSize:18,lineHeight:1,padding:"0 2px"}}>×</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div className="field-wrap">
          <div className="field-label-form">Marka</div>
          <select className="form-select" value={entry.make||""} onChange={e=>{
            onChange(index,{...entry,make:e.target.value,model:""});
          }}>
            <option value="">— Seçin —</option>
            {CAR_MAKES.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="field-wrap">
          <div className="field-label-form">Model</div>
          {models.length>0?(
            <select className="form-select" value={entry.model||""} onChange={e=>onChange(index,{...entry,model:e.target.value})}>
              <option value="">— Seçin —</option>
              {models.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          ):(
            <input className="form-input" placeholder="Model" maxLength={50} value={entry.model||""} onChange={e=>onChange(index,{...entry,model:e.target.value})}/>
          )}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div className="field-wrap">
          <div className="field-label-form">İldən</div>
          <select className="form-select" value={entry.yearFrom||""} onChange={e=>onChange(index,{...entry,yearFrom:e.target.value?Number(e.target.value):null})}>
            <option value="">—</option>
            {YEAR_OPTIONS.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="field-wrap">
          <div className="field-label-form">İlə qədər</div>
          <select className="form-select" value={entry.yearTo||""} onChange={e=>onChange(index,{...entry,yearTo:e.target.value?Number(e.target.value):null})}>
            <option value="">—</option>
            {YEAR_OPTIONS.filter(y=>!entry.yearFrom||y>=entry.yearFrom).map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function ProductForm({product,seller,onBack,onSaved,onDeleted}){
  const isEdit=!!product?.id;

  // Migrate legacy flat fields to compatibility array on edit
  const initCompat=()=>{
    if(product?.compatibility && product.compatibility.length>0) return product.compatibility;
    if(product?.brand||product?.model) return [{make:product.brand||"",model:product.model||"",yearFrom:product.yearFrom||null,yearTo:product.yearTo||null}];
    return [{make:"",model:"",yearFrom:null,yearTo:null}];
  };

  const [form,setForm]=useState({
    name:product?.name||"",
    partType:product?.partType||"",
    manufacturerBrand:product?.manufacturerBrand||"",
    manufacturerCountry:product?.manufacturerCountry||"",
    condition:product?.condition||AZ.condNew,
    price:product?.price||"",
    availability:product?.availability||"in_stock",
    notes:product?.notes||"",
    engine:product?.engine||"",
  });
  const [compat,setCompat]=useState(initCompat);
  const [errors,setErrors]=useState({});
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState(null);
  const nameRef=useRef();
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const updateCompat=(i,val)=>setCompat(arr=>arr.map((e,idx)=>idx===i?val:e));
  const addCompat=()=>setCompat(arr=>[...arr,{make:"",model:"",yearFrom:null,yearTo:null}]);
  const removeCompat=(i)=>setCompat(arr=>arr.filter((_,idx)=>idx!==i));

  const handleSave=async(asDraft=false)=>{
    if(!form.name.trim()){setErrors({name:true});nameRef.current?.scrollIntoView({behavior:"smooth",block:"center"});nameRef.current?.focus();return;}
    setErrors({});setSaving(true);
    // Filter out empty compat rows
    const cleanCompat=compat.filter(e=>e.make||e.model);
    const data={
      ...form,
      price:form.price?Number(form.price):null,
      compatibility:cleanCompat,
      // Keep legacy fields for backward compat with search on old docs
      brand:cleanCompat[0]?.make||"",
      model:cleanCompat[0]?.model||"",
      yearFrom:cleanCompat[0]?.yearFrom||null,
      yearTo:cleanCompat[0]?.yearTo||null,
      status:asDraft?"draft":"live",
      sellerId:seller.uid,
      region:cityToRegion(seller.city),
      updatedAt:serverTimestamp(),
    };
    try{
      if(isEdit){await db.collection("products").doc(product.id).update(data);}
      else{data.createdAt=serverTimestamp();await db.collection("products").add(data);}
      onSaved(asDraft);
    }catch(e){console.error(e);setSaveError("Saxlama mümkün olmadı. Yenidən cəhd edin.");}
    finally{setSaving(false);}
  };

  const handleDelete=async()=>{
    if(!window.confirm(AZ.confirmDelete))return;
    try{await db.collection("products").doc(product.id).delete();onDeleted();}
    catch(e){console.error(e);}
  };

  const COUNTRIES=["Azərbaycan","Türkiyə","Almaniya","Çin","Yaponiya","Cənubi Koreya","ABŞ","Fransa","İtaliya","İspaniya","Rusiya","Polşa","Çexiya","Hindistan","Tailand","Digər"];

  return(
    <div>
      <div className="form-header">
        <button className="icon-btn" onClick={onBack}><Icon name="arrowLeft" size={16} strokeWidth={2}/></button>
        <div className="form-title">{isEdit?AZ.editProductTitle:AZ.addProductTitle}</div>
      </div>
      <div className="form-body">

        {/* ── Part info ── */}
        <div className="form-section-title">{AZ.productSection}</div>
        <div className="field-group-form">
          <div className="field-wrap" ref={nameRef}>
            <div className="field-label-form">{AZ.partName} <span className="req">— {AZ.required}</span></div>
            <input className={`form-input${errors.name?" error":""}`} placeholder="məs. Ön tormoz bəndləri" maxLength={100}
              value={form.name} onChange={e=>{set("name",e.target.value);if(errors.name)setErrors({});}}/>
          </div>
          <div className="field-wrap">
            <div className="field-label-form">{AZ.partType}</div>
            <select className="form-select" value={form.partType} onChange={e=>set("partType",e.target.value)}>
              <option value="">{AZ.selectType}</option>
              {AZ.partTypes.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <div className="field-label-form">{AZ.condition}</div>
            <select className="form-select" value={form.condition} onChange={e=>set("condition",e.target.value)}>
              <option value={AZ.condNew}>{AZ.condNew}</option>
              <option value={AZ.condUsed}>{AZ.condUsed}</option>
              <option value={AZ.condRefurb}>{AZ.condRefurb}</option>
            </select>
          </div>
        </div>

        {/* ── Manufacturer ── */}
        <div className="form-section-title">İstehsalçı</div>
        <div className="field-group-form">
          <div className="form-row">
            <div className="field-wrap">
              <div className="field-label-form">Marka</div>
              <input className="form-input" placeholder="Bosch, Brembo..." maxLength={50} value={form.manufacturerBrand} onChange={e=>set("manufacturerBrand",e.target.value)}/>
            </div>
            <div className="field-wrap">
              <div className="field-label-form">Ölkə</div>
              <select className="form-select" value={form.manufacturerCountry} onChange={e=>set("manufacturerCountry",e.target.value)}>
                <option value="">— Seçin —</option>
                {COUNTRIES.map(ct=><option key={ct} value={ct}>{ct}</option>)}
              </select>
            </div>
          </div>
          <div className="field-wrap">
            <div className="field-label-form">Mühərrik</div>
            <input className="form-input" placeholder="1.6 benzin, 2.0 dizel..." maxLength={50} value={form.engine} onChange={e=>set("engine",e.target.value)}/>
          </div>
        </div>

        {/* ── Compatibility ── */}
        <div className="form-section-title" style={{marginTop:22}}>Avtomobil uyğunluğu</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {compat.map((entry,i)=>(
            <CompatRow key={i} entry={entry} index={i} onChange={updateCompat} onRemove={removeCompat} showRemove={compat.length>1}/>
          ))}
          <button onClick={addCompat} style={{background:"none",border:"2px dashed var(--g200)",borderRadius:"var(--r-sm)",padding:"11px",fontSize:13,color:"var(--g500)",cursor:"pointer",fontFamily:"var(--font-b)",fontWeight:600,transition:"border-color .15s,color .15s"}}
            onMouseOver={e=>{e.target.style.borderColor="var(--g300)";e.target.style.color="var(--black)";}}
            onMouseOut={e=>{e.target.style.borderColor="var(--g200)";e.target.style.color="var(--g500)";}}>
            + Avtomobil əlavə et
          </button>
        </div>

        {/* ── Pricing ── */}
        <div className="form-section-title" style={{marginTop:22}}>{AZ.pricingSection}</div>
        <div className="field-group-form">
          <div className="field-wrap">
            <div className="field-label-form">{AZ.price}</div>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"var(--g500)"}}>₼</span>
              <input className="form-input" type="number" placeholder="185" max={999999} value={form.price} onChange={e=>set("price",e.target.value)} style={{paddingLeft:30}}/>
            </div>
          </div>
          <div className="field-wrap">
            <div className="field-label-form">{AZ.availability}</div>
            <select className="form-select" value={form.availability} onChange={e=>set("availability",e.target.value)}>
              <option value="in_stock">{AZ.inStockOpt}</option>
              <option value="on_order">{AZ.onOrderOpt}</option>
            </select>
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="form-section-title" style={{marginTop:22}}>{AZ.notesSection}</div>
        <textarea className="form-input" rows={3} placeholder={AZ.notesPlaceholder} maxLength={500} value={form.notes} onChange={e=>set("notes",e.target.value)} style={{resize:"vertical"}}/>

        {saveError&&<div className="inline-error">{saveError}</div>}
        <div className="form-footer">
          {isEdit&&<button className="btn btn-danger" onClick={handleDelete}>{AZ.delete}</button>}
          <button className="btn btn-secondary" onClick={()=>handleSave(true)} disabled={saving}>{AZ.saveDraft}</button>
          <button className="btn btn-primary" onClick={()=>handleSave(false)} disabled={saving}>{saving?AZ.saving:AZ.publish}</button>
        </div>
      </div>
    </div>
  );
}
