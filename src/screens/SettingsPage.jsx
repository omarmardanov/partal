import { useState } from "react";
import { db, serverTimestamp } from "../firebase.js";
import { AZ } from "../i18n.js";
import { AZ_CITIES, cityToRegion } from "../lib/regions.js";
import { isValidEmail, isValidAzPhone, isValidIntlPhone } from "../lib/format.js";
import Icon from "../components/Icon.jsx";
import { AzPhoneInput, IntlPhoneInput, EmailInput } from "../components/FormInputs.jsx";

export default function SettingsPage({seller,onSave,onLogout,onBack}){
  const [form,setForm]=useState({
    shopName:seller?.shopName||"",
    city:seller?.city||"Bakı",
    phone:seller?.phone||"",
    whatsapp:seller?.whatsapp||"",
    email:seller?.email||"",
  });
  const [saving,setSaving]=useState(false);
  const [settingsError,setSettingsError]=useState(null);
  const [errors,setErrors]=useState({});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleSave=async()=>{
    const errs={};
    if(!isValidAzPhone(form.phone)) errs.phone=AZ.errPhone;
    if(!isValidIntlPhone(form.whatsapp)) errs.whatsapp=AZ.errWhatsapp;
    setErrors(errs);
    if(Object.keys(errs).length||!isValidEmail(form.email)) return;
    setSaving(true);
    try{
      await db.collection("sellers").doc(seller.uid).update({
        ...form,
        region:cityToRegion(form.city),
        updatedAt:serverTimestamp(),
      });
      onSave(form);
    }catch(e){console.error(e);setSettingsError("Saxlama mümkün olmadı. Yenidən cəhd edin.");}
    finally{setSaving(false);}
  };

  return(
    <div>
      <div className="settings-header">
        <button className="icon-btn" onClick={onBack}><Icon name="arrowLeft" size={16} strokeWidth={2}/></button>
        <div className="form-title">{AZ.settingsTitle}</div>
      </div>
      <div className="settings-body">
        <div className="settings-section">
          <div className="settings-section-title">{AZ.shopInfo}</div>
          <div className="field-group-form">
            <div className="field-wrap">
              <div className="field-label-form">{AZ.shopName}</div>
              <input className="form-input" placeholder="Vera Auto Hissələri" maxLength={80} value={form.shopName} onChange={e=>set("shopName",e.target.value)}/>
            </div>
            <div className="field-wrap">
              <div className="field-label-form">{AZ.city}</div>
              <select className="form-select" value={form.city} onChange={e=>set("city",e.target.value)}>
                {AZ_CITIES.map(ct=><option key={ct} value={ct}>{ct}</option>)}
              </select>
            </div>
            <AzPhoneInput label={AZ.phone} value={form.phone} onChange={v=>set("phone",v)} required error={errors.phone}/>
            <IntlPhoneInput label={AZ.whatsappNum} value={form.whatsapp} onChange={v=>set("whatsapp",v)} placeholder="+994501234567" required error={errors.whatsapp}/>
            <EmailInput label={AZ.emailAddr} value={form.email} onChange={v=>set("email",v)}/>
          </div>
        </div>
        {settingsError&&<div className="inline-error">{settingsError}</div>}
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-primary" style={{flex:2}} onClick={handleSave} disabled={saving}>
            {saving?AZ.saving:AZ.saveSettings}
          </button>
          <button className="btn btn-danger" style={{flex:1}} onClick={onLogout}>
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <Icon name="logout" size={14} color="var(--red)" strokeWidth={2}/>{AZ.logout}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
