import { useState } from "react";
import { auth, GoogleAuthProvider } from "../firebase.js";
import { AZ } from "../i18n.js";
import { ensureSellerProfile } from "../sellerProfile.js";
import { isValidEmail } from "../lib/format.js";
import Icon from "../components/Icon.jsx";
import PhoneLogin from "../components/PhoneLogin.jsx";

// SMS login needs the paid Firebase Blaze plan — see PhoneLogin.jsx
const PHONE_LOGIN_ENABLED = false;

const AUTH_ERRORS = {
  "auth/invalid-credential": AZ.errWrongCreds,
  "auth/wrong-password": AZ.errWrongCreds,
  "auth/user-not-found": AZ.errWrongCreds,
  "auth/invalid-email": AZ.errEmail,
  "auth/email-already-in-use": AZ.errEmailInUse,
  "auth/weak-password": AZ.errWeakPassword,
  "auth/too-many-requests": AZ.errTooMany,
};
const authErrorText = e => AUTH_ERRORS[e.code] || AZ.errGeneral+(e.code?" ("+e.code+")":"");

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48" style={{flexShrink:0}}>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

export default function LoginPage({onLogin,onBack}){
  const [mode,setMode]=useState("signin"); // signin | signup
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [info,setInfo]=useState("");

  const finish=async user=>{
    const {info:seller,isNew}=await ensureSellerProfile(user);
    onLogin(seller,isNew);
  };

  const signInGoogle=async()=>{
    setError("");setInfo("");setLoading(true);
    try{
      const res=await auth.signInWithPopup(new GoogleAuthProvider());
      await finish(res.user);
    }catch(e){
      if(e.code!=="auth/popup-closed-by-user"&&e.code!=="auth/cancelled-popup-request"){console.error(e);setError(authErrorText(e));}
    }finally{setLoading(false);}
  };

  const submitEmail=async ev=>{
    ev.preventDefault();
    setError("");setInfo("");
    if(!email||!isValidEmail(email)){setError(AZ.errEmail);return;}
    if(password.length<6){setError(AZ.errWeakPassword);return;}
    setLoading(true);
    try{
      const res=mode==="signup"
        ? await auth.createUserWithEmailAndPassword(email,password)
        : await auth.signInWithEmailAndPassword(email,password);
      await finish(res.user);
    }catch(e){console.error(e);setError(authErrorText(e));}
    finally{setLoading(false);}
  };

  const resetPassword=async()=>{
    setError("");setInfo("");
    if(!email||!isValidEmail(email)){setError(AZ.errEmail);return;}
    try{await auth.sendPasswordResetEmail(email);setInfo(AZ.resetSent);}
    catch(e){console.error(e);setError(authErrorText(e));}
  };

  const isSignup=mode==="signup";

  return(
    <div className="login-page">
      <div style={{marginBottom:32}}><button className="back-btn" onClick={onBack}><Icon name="arrowLeft" size={14} strokeWidth={2}/> {AZ.back}</button></div>
      <div className="login-headline">{AZ.loginTitle}</div>
      <div className="login-sub">{AZ.loginSub}</div>

      <div className="login-step">
        <button className="cta-btn secondary" onClick={signInGoogle} disabled={loading}><GoogleIcon/>{AZ.continueGoogle}</button>

        <div className="login-divider"><span>{AZ.or}</span></div>

        <form onSubmit={submitEmail} noValidate>
          <div className="login-field-label">{AZ.emailAddr}</div>
          <input className="form-input" type="email" autoComplete="email" placeholder="mağaza@example.az" maxLength={100}
            value={email} onChange={e=>setEmail(e.target.value.replace(/\s/g,""))}/>
          <div className="login-field-label" style={{marginTop:14}}>{AZ.password}</div>
          <input className="form-input" type="password" autoComplete={isSignup?"new-password":"current-password"} maxLength={100}
            value={password} onChange={e=>setPassword(e.target.value)}/>
          {isSignup&&<div className="login-hint">{AZ.passwordHint}</div>}
          {error&&<div className="error-msg">{error}</div>}
          {info&&<div className="login-hint" style={{color:"var(--green)"}}>{info}</div>}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading?<span className="loading-dots">{AZ.saving}</span>:isSignup?AZ.signUp:AZ.verify}
          </button>
        </form>

        <div className="login-links">
          <button className="text-link" onClick={()=>{setMode(isSignup?"signin":"signup");setError("");setInfo("");}}>
            {isSignup?AZ.haveAccount:AZ.noAccount}
          </button>
          {!isSignup&&<button className="text-link" onClick={resetPassword}>{AZ.forgotPassword}</button>}
        </div>

        {PHONE_LOGIN_ENABLED&&<><div className="login-divider"><span>{AZ.or}</span></div><PhoneLogin onLogin={onLogin}/></>}
      </div>
    </div>
  );
}
