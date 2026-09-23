import { AZ } from "../i18n.js";

export function formatDateAZ(date) {
  if (!date) return null;
  const d = new Date(date), diffDays = Math.floor((new Date()-d)/86400000);
  if (diffDays===0) return "Bu gün";
  if (diffDays===1) return "Dünən";
  if (diffDays<7) return `${diffDays} ${AZ.daysAgo}`;
  return `${d.getDate()} ${AZ.months[d.getMonth()]} ${d.getFullYear()}`;
}

// Format +994 XX XXX XX XX — stores raw digits after +994
export function formatAzPhone(raw){
  const d=raw.replace(/\D/g,"").slice(0,9);
  let o="";
  if(d.length>0) o+=d.slice(0,2);
  if(d.length>2) o+=" "+d.slice(2,5);
  if(d.length>5) o+=" "+d.slice(5,7);
  if(d.length>7) o+=" "+d.slice(7,9);
  return o;
}

// Format international WhatsApp number — digits only, up to 15
export function formatIntlPhone(raw){
  // Keep leading + if present, then digits only
  const hasPlus=raw.startsWith("+");
  const d=raw.replace(/\D/g,"").slice(0,15);
  return (hasPlus?"+":"")+d;
}

// Validate email loosely
// +994 and 9 digits
export function isValidAzPhone(v){ return /^\+994\d{9}$/.test(v||""); }
// + and 10–15 digits (international, for WhatsApp)
export function isValidIntlPhone(v){ return /^\+\d{10,15}$/.test(v||""); }

export function isValidEmail(v){ return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
