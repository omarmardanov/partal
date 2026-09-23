import { useState, useEffect, useRef } from "react";
import { auth, RecaptchaVerifier } from "../firebase.js";
import { AZ } from "../i18n.js";
import { ensureSellerProfile } from "../sellerProfile.js";
import PhoneInput from "./PhoneInput.jsx";

// SMS login. Disabled: Firebase phone auth requires the paid Blaze plan.
// Turn on via PHONE_LOGIN_ENABLED in LoginPage.jsx after upgrading.
export default function PhoneLogin({onLogin}){
  const [step,setStep]=useState("phone");
  const [phone,setPhone]=useState("");
  const [otp,setOtp]=useState(["","","","","",""]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [confirmResult,setConfirmResult]=useState(null);
  const refs=[useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  // Set up invisible reCAPTCHA once
  const recaptchaRef=useRef(null);
  const makeRecaptcha=()=>{
    const v=new RecaptchaVerifier("recaptcha-container",{size:"invisible"});
    v.render().catch(e=>console.warn("reCAPTCHA render:",e));
    return v;
  };
  useEffect(()=>{
    // Small delay to ensure DOM is ready before reCAPTCHA tries to render
    const timer = setTimeout(()=>{
      try{
        if(!recaptchaRef.current) recaptchaRef.current=makeRecaptcha();
      }catch(e){console.warn("reCAPTCHA init:",e);}
    }, 100);
    return()=>{
      clearTimeout(timer);
      try{recaptchaRef.current?.clear();}catch(e){}
      recaptchaRef.current=null;
    };
  },[]);

  const sendCode=async()=>{
    if(phone.length<9){setError(AZ.errPhone);return;}
    setError("");setLoading(true);
    try{
      const fullPhone="+994"+phone;
      if(!recaptchaRef.current) recaptchaRef.current=makeRecaptcha();
      const result=await auth.signInWithPhoneNumber(fullPhone,recaptchaRef.current);
      setConfirmResult(result);
      setStep("otp");
      setTimeout(()=>refs[0].current?.focus(),120);
    }catch(e){
      console.error(e);
      setError(AZ.errGeneral+(e.code?" ("+e.code+")":""));
      // Reset recaptcha on error
      try{recaptchaRef.current?.clear();}catch(e2){}
      try{recaptchaRef.current=makeRecaptcha();}catch(e2){recaptchaRef.current=null;}
    }finally{setLoading(false);}
  };

  const handleOtp=(i,val)=>{
    if(!/^\d?$/.test(val))return;
    const n=[...otp];n[i]=val;setOtp(n);
    if(val&&i<5)refs[i+1].current?.focus();
    if(n.every(d=>d)&&val) verifyCode(n.join(""));
  };
  const handleKey=(i,e)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)refs[i-1].current?.focus();};

  const verifyCode=async(code)=>{
    if(!confirmResult)return;
    setError("");setLoading(true);
    try{
      const result=await confirmResult.confirm(code);
      const {info,isNew}=await ensureSellerProfile(result.user);
      onLogin(info,isNew);
    }catch(e){
      console.error(e);
      setError(AZ.errCode);
      setOtp(["","","","","",""]);
      setTimeout(()=>refs[0].current?.focus(),100);
    }finally{setLoading(false);}
  };

  return(
    <>
      {step==="phone"&&(
        <div className="login-step">
          <div className="login-field-label">{AZ.phoneLabel}</div>
          <PhoneInput value={phone} onChange={setPhone} autoFocus/>
          {error&&<div className="error-msg">{error}</div>}
          <button className="login-btn" onClick={sendCode} disabled={phone.length<9||loading}>
            {loading?<span className="loading-dots">Göndərilir</span>:AZ.sendCode}
          </button>
        </div>
      )}
      {step==="otp"&&(
        <div className="login-step">
          <div className="login-field-label">{AZ.codeLabel}</div>
          <div className="otp-boxes">
            {otp.map((d,i)=>(
              <input key={i} ref={refs[i]} className="otp-box" type="tel" inputMode="numeric"
                maxLength={1} value={d} onChange={e=>handleOtp(i,e.target.value)} onKeyDown={e=>handleKey(i,e)}/>
            ))}
          </div>
          <div className="login-hint">{AZ.codeSub}</div>
          {error&&<div className="error-msg">{error}</div>}
          {loading&&<div style={{textAlign:"center",marginTop:12,fontSize:13,color:"var(--g500)"}}>Yoxlanılır...</div>}
          <div style={{textAlign:"center",marginTop:16}}>
            <button className="text-link" onClick={()=>{setStep("phone");setOtp(["","","","","",""]);setError("");}}>{AZ.resend}</button>
          </div>
        </div>
      )}
    </>
  );
}
