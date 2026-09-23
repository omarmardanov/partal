import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";

// ── SEARCH TEXTAREA ──
export default function SearchTextarea({value,onChange,onSubmit,placeholder}){
  const ref=useRef();
  useEffect(()=>{const el=ref.current;if(!el)return;el.style.height="auto";el.style.height=Math.max(90,el.scrollHeight)+"px";},[value]);
  return(
    <div className="search-box">
      <textarea ref={ref} className="search-input" placeholder={placeholder} value={value} rows={2} maxLength={200}
        onChange={e=>onChange(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSubmit();}}}/>
      <button className="search-go" onClick={onSubmit}><Icon name="arrowRight" size={14} color="white" strokeWidth={2.5}/></button>
    </div>
  );
}
