import { useState } from "react";
import { AZ } from "../i18n.js";
import { formatAzPhone, isValidEmail } from "../lib/format.js";

const Label=({label,required})=>(
  <div className="field-label-form">{label}{required&&<span className="req"> — {AZ.required}</span>}</div>
);
const FieldError=({error})=>error?<div style={{fontSize:11,color:"var(--red)",marginTop:3}}>{error}</div>:null;

export function AzPhoneInput({value, onChange, label, required, error}){
  // value stored as "+994XXXXXXXXX" or "XXXXXXXXX" (9 digits)
  const digits = value.replace(/\D/g,"").replace(/^994/,"").slice(0,9);
  return(
    <div className="field-wrap">
      <Label label={label} required={required}/>
      <div className="phone-wrap" style={error?{borderColor:"var(--red)"}:undefined}>
        <span className="phone-prefix">+994</span>
        <input className="phone-input" type="tel" placeholder="50 000 00 00"
          value={formatAzPhone(digits)}
          onChange={e=>{
            const d=e.target.value.replace(/\D/g,"").slice(0,9);
            onChange(d.length>0?"+994"+d:"");
          }}/>
      </div>
      <FieldError error={error}/>
    </div>
  );
}

export function IntlPhoneInput({value, onChange, label, placeholder, required, error}){
  // Always show + prefix, user types digits after it
  // Store as +XXXXXXXXXXXXXXX
  const digits=(value||"").replace(/\D/g,"").slice(0,15);
  return(
    <div className="field-wrap">
      <Label label={label} required={required}/>
      <div className="phone-wrap" style={error?{borderColor:"var(--red)"}:undefined}>
        <span className="phone-prefix">+</span>
        <input className="phone-input" type="tel" placeholder="994501234567"
          value={digits}
          onKeyDown={e=>{
            const allowed=["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Home","End"];
            if(allowed.includes(e.key)) return;
            if(!/^\d$/.test(e.key)) e.preventDefault();
          }}
          onChange={e=>{
            const d=e.target.value.replace(/\D/g,"").slice(0,15);
            onChange(d.length>0?"+"+d:"");
          }}/>
      </div>
      <FieldError error={error}/>
    </div>
  );
}

export function EmailInput({value, onChange, label}){
  const [touched,setTouched]=useState(false);
  const invalid=touched && !isValidEmail(value);
  return(
    <div className="field-wrap">
      <div className="field-label-form">{label}</div>
      <input className={`form-input${invalid?" error":""}`} type="email"
        placeholder="mağaza@example.az" maxLength={100}
        value={value}
        onChange={e=>onChange(e.target.value.replace(/\s/g,""))}
        onBlur={()=>setTouched(true)}/>
      {invalid&&<div style={{fontSize:11,color:"var(--red)",marginTop:3}}>Düzgün e-poçt daxil edin</div>}
    </div>
  );
}
