import { useState, useEffect } from "react";
import { db, auth } from "./firebase.js";
import { gaEvent } from "./analytics.js";
import { AZ } from "./i18n.js";
import { isProfileComplete } from "./lib/format.js";
import Logo from "./components/Logo.jsx";
import Toast from "./components/Toast.jsx";
import Spinner from "./components/Spinner.jsx";
import ErrorScreen from "./components/ErrorScreen.jsx";
import RegionSelector from "./components/RegionSelector.jsx";
import BuyerHome from "./screens/BuyerHome.jsx";
import ResultsPage from "./screens/ResultsPage.jsx";
import ProductSheet from "./screens/ProductSheet.jsx";
import LoginPage from "./screens/LoginPage.jsx";
import SettingsPage from "./screens/SettingsPage.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import ProductForm from "./screens/ProductForm.jsx";
import UploadScreen from "./screens/UploadScreen.jsx";
import ReviewScreen from "./screens/ReviewScreen.jsx";

// ── ROOT APP ──
export default function App(){
  const [authLoading,setAuthLoading]=useState(true);
  const [appError,setAppError]=useState(null);
  const [region,setRegion]=useState("baku");
  const [mode,setMode]=useState("buyer");
  const [screen,setScreen]=useState("home");
  const [query,setQuery]=useState("");
  const [selectedProduct,setSP]=useState(null);
  const [selectedSeller,setSeller]=useState(null);
  const [editingProduct,setEP]=useState(null);
  const [uploadData,setUD]=useState(null);
  const [currentUser,setCurrentUser]=useState(null); // Firebase auth user
  const [sellerInfo,setSellerInfo]=useState(null);   // Firestore seller profile

  const [toast,setToast]=useState(null);
  const showToast=msg=>setToast(msg);

  // Auth state listener
  useEffect(()=>{
    return auth.onAuthStateChanged(async user=>{
      try{
        if(user){
          setCurrentUser(user);
          const doc=await db.collection("sellers").doc(user.uid).get();
          if(doc.exists){
            setSellerInfo({uid:user.uid,...doc.data()});
            setMode("seller");
            setScreen(prev=>prev==="login"?"dashboard":prev);
          } else {
            gaEvent("seller_registered",{method:user.providerData[0]?.providerId||"unknown"});
          }
        }else{
          setCurrentUser(null);setSellerInfo(null);
          setMode("buyer");
        }
      }catch(e){
        console.error("Auth error:",e);
        setAppError("Hesaba giriş mümkün olmadı. Səhifəni yenилəyin.");
      }finally{
        setAuthLoading(false);
      }
    });
  },[]);

  // Live seller cities for dynamic region list
  const [sellerCities,setSellerCities]=useState([]);
  useEffect(()=>{
    return db.collection("sellers").onSnapshot(snap=>{
      const cities=[];
      snap.docs.forEach(d=>{const data=d.data();if(data.city) cities.push(data.city);});
      setSellerCities([...new Set(cities)]);
    });
  },[]);

  const goHome=()=>{setMode("buyer");setScreen("home");setSP(null);};

  const handleLogin=(info, isNew)=>{
    // Don't set currentUser manually — onAuthStateChanged fires automatically
    // after Firebase auth and sets the real user object reliably
    setSellerInfo(info);
    setMode("seller");setScreen(isNew?"settings":"dashboard");
  };

  const handleLogout=async()=>{
    await auth.signOut();
    setCurrentUser(null);setSellerInfo(null);
    setMode("buyer");setScreen("home");
    showToast("Çıxış edildi");
  };

  const handleSaveSettings=async(form)=>{
    const updated={...sellerInfo,...form};setSellerInfo(updated);
    setScreen("dashboard");showToast(AZ.settingsSaved);
  };

  if(authLoading) return <div className="app"><div className="topnav"><Logo/></div><Spinner/></div>;
  if(appError) return <div className="app"><div className="topnav"><Logo/></div><ErrorScreen message={appError} onRetry={()=>window.location.reload()}/></div>;

  const renderBuyer=()=>{
    if(screen==="results")return <ResultsPage query={query} region={region} onBack={()=>setScreen("home")} onProduct={(p,s)=>{setSP(p);setSeller(s);}} onContact={()=>{}}/>;
    if(screen==="login")return <LoginPage onLogin={handleLogin} onBack={()=>setScreen("home")}/>;
    return <BuyerHome onSearch={q=>{setQuery(q);setScreen("results");gaEvent("search",{search_term:q});}} onSellerLogin={()=>{if(currentUser&&sellerInfo){setMode("seller");setScreen("dashboard");}else{setScreen("login");}}} sellerCities={sellerCities} region={region} onRegion={setRegion}/>;
  };

  const renderSeller=()=>{
    if(!currentUser)return authLoading?<Spinner/>:<LoginPage onLogin={handleLogin} onBack={goHome}/>;
    // Buyers contact sellers by phone/WhatsApp — no dashboard until both are filled in
    if(sellerInfo&&!isProfileComplete(sellerInfo))return <SettingsPage seller={sellerInfo} onSave={handleSaveSettings} onLogout={handleLogout} onBack={goHome}/>;
    if(screen==="form")return <ProductForm product={editingProduct} seller={sellerInfo} onBack={()=>{setScreen("dashboard");setEP(null);}} onSaved={(isDraft)=>{setScreen("dashboard");setEP(null);showToast(isDraft?AZ.draftSaved:editingProduct?.id?AZ.productUpdated:AZ.productAdded);}} onDeleted={()=>{setScreen("dashboard");setEP(null);showToast(AZ.productDeleted);}}/>;
    if(screen==="upload")return <UploadScreen seller={sellerInfo} onBack={()=>setScreen("dashboard")} onReview={d=>{setUD(d);setScreen("review");}}/>;
    if(screen==="review"&&uploadData)return <ReviewScreen data={uploadData} seller={sellerInfo} onBack={()=>setScreen("upload")} onPublish={(count,uploadDate)=>{
              if(uploadDate) setSellerInfo(s=>({...s,lastUpload:uploadDate}));
              showToast(`${count} ${AZ.published}`);
              setScreen("dashboard");setUD(null);
            }}/>;
    if(screen==="settings")return <SettingsPage seller={sellerInfo} onSave={handleSaveSettings} onLogout={handleLogout} onBack={()=>setScreen(sellerInfo?.shopName?"dashboard":"settings")}/>;
    return <Dashboard seller={sellerInfo} onAdd={()=>{setEP(null);setScreen("form");}} onEdit={p=>{setEP(p);setScreen("form");}} onUpload={()=>setScreen("upload")} onSettings={()=>setScreen("settings")}/>;
  };

  return(
    <div className="app">
      <nav className="topnav">
        <Logo onClick={goHome}/>
        {mode==="buyer"&&<RegionSelector region={region} onChange={setRegion} sellerCities={sellerCities}/>}
        {mode==="seller"&&currentUser&&sellerInfo&&(
          <div className="topnav-stats">
            <div className="topnav-stats-label">{AZ.todayStats}</div>
            <div id="header-stats">— {AZ.views} · — {AZ.contacts}</div>
          </div>
        )}
      </nav>
      <main className="main">{mode==="buyer"?renderBuyer():renderSeller()}</main>
      {selectedProduct&&<ProductSheet product={selectedProduct} seller={selectedSeller} onClose={()=>{setSP(null);setSeller(null);}} onContact={()=>{}}/>}
      {toast&&<Toast message={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}
