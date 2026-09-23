// Login phone field: +994 prefix, 9 digits

export default function PhoneInput({value,onChange,autoFocus}){
  const fmt=d=>{const s=d.slice(0,9);let o="";if(s.length>0)o+=s.slice(0,2);if(s.length>2)o+=" "+s.slice(2,5);if(s.length>5)o+=" "+s.slice(5,7);if(s.length>7)o+=" "+s.slice(7,9);return o;};
  return(
    <div className="phone-wrap">
      <span className="phone-prefix">+994</span>
      <input className="phone-input" type="tel" placeholder="50 000 00 00" autoFocus={autoFocus}
        value={fmt(value)} onChange={e=>onChange(e.target.value.replace(/\D/g,"").slice(0,9))}/>
    </div>
  );
}
