import { useState } from "react";
import Papa from "papaparse";
import { AZ } from "../i18n.js";
import { inferCols, normalizeRows } from "../lib/csv.js";
import Icon from "../components/Icon.jsx";

// ── UPLOAD ──
export default function UploadScreen({seller,onBack,onReview}){
  const [file,setFile]=useState(null);
  const [drag,setDrag]=useState(false);
  const [parsing,setParsing]=useState(false);
  const handleFile=f=>{if(!f)return;if(!["csv","xls","xlsx"].includes(f.name.split(".").pop().toLowerCase())){alert("Zəhmət olmasa CSV, XLS və ya XLSX fayl yükləyin.");return;}setFile(f);};
  const analyze=()=>{
    setParsing(true);
    Papa.parse(file,{header:true,skipEmptyLines:true,complete:r=>{
      setTimeout(()=>{const m=inferCols(r.meta.fields||[]);const rws=normalizeRows(r.data,m);setParsing(false);onReview({mappings:m,rows:rws,fileName:file.name});},800);
    },error:()=>{setParsing(false);alert("Fayl oxunarkən xəta baş verdi.");}});
  };
  return(
    <div>
      <div className="form-header"><button className="icon-btn" onClick={onBack}><Icon name="arrowLeft" size={16} strokeWidth={2}/></button><div className="form-title">{AZ.uploadTitle}</div></div>
      <div className="upload-body">
        <div className={`upload-zone ${drag?"drag":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}>
          <input type="file" accept=".csv,.xls,.xlsx" className="upload-input" onChange={e=>handleFile(e.target.files[0])}/>
          <div className="upload-icon">📁</div>
          <div className="upload-main">{AZ.dropFile}</div>
          <div className="upload-sub">CSV, XLS və ya XLSX · İstənilən sütun adları</div>
        </div>
        {file&&(<div className="file-info"><div style={{fontSize:22}}>📄</div><div><div style={{fontSize:14,fontWeight:500}}>{file.name}</div><div style={{fontSize:12,color:"var(--g500)"}}>{(file.size/1024).toFixed(1)} KB</div></div></div>)}
        <button className="analyze-btn" disabled={!file||parsing} onClick={analyze}>{parsing?<span className="loading-dots">{AZ.analyzing}</span>:AZ.analyzeBtn}</button>
        <div style={{textAlign:"center"}}><button className="text-link" onClick={()=>{const headers=["Hissə adı","Hissə növü","Vəziyyət","İstehsalçı marka","İstehsalçı ölkə","Mühərrik","Avtomobil markaları","Avtomobil modelləri","İldən","İlə qədər","Qiymət","Mövcudluq","Qeydlər"];
const rows=[
  // Single-compat products — one row
  ["Radiator OEM","Radiator","Yeni","","","1.6 benzin","Peugeot","308","2014","2019","185","var","Ventilyator daxildir"],
  ["Alternator işlənmiş","Alternator","İşlənmiş","Bosch","Almaniya","1.6","Lada/VAZ","Granta","2015","2022","120","var",""],
  ["Amortizator ön sol","Amortizator","Yeni","","Çin","","Hyundai","Accent","2014","2020","68","sifarişlə",""],
  // Multi-compat product — repeat the product on multiple rows, one car per row
  // Same name+price on each row = system groups them into one product with multiple compatibility entries
  ["Ön tormoz bəndləri","Tormoz bəndi","Yeni","Brembo","İtaliya","","Toyota","Camry","2015","2022","55","var",""],
  ["Ön tormoz bəndləri","Tormoz bəndi","Yeni","Brembo","İtaliya","","Toyota","Corolla","2014","2021","55","var",""],
  ["Ön tormoz bəndləri","Tormoz bəndi","Yeni","Brembo","İtaliya","","Hyundai","Elantra","2018","2023","55","var",""],
  ["Yağ filteri","Yağ filteri","Yeni","Mann","Almaniya","","Toyota","Camry","2015","2023","18","var",""],
  ["Yağ filteri","Yağ filteri","Yeni","Mann","Almaniya","","Honda","Accord","2016","2022","18","var",""],
];
const csv=[headers,...rows].map(r=>r.map(v=>String(v).includes(",")?`"${v}"`:v).join(",")).join("\n");
const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="numune_mehsul_siyahisi.csv";a.click();}}>{AZ.downloadSample}</button></div>
      </div>
    </div>
  );
}
