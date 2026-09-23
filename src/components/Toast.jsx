import { useEffect } from "react";

export default function Toast({message,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  return <div className="toast">{message}</div>;
}
