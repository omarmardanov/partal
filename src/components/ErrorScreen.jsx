export default function ErrorScreen({message,onRetry}){
  return(<div className="error-screen"><div className="error-icon">⚠️</div><div className="error-title">Xəta baş verdi</div><div className="error-sub">{message||"Məlumatlar yüklənmədi. İnternet bağlıntınızı yoxlayın."}</div>{onRetry&&<button className="error-retry" onClick={onRetry}>Yenidən cəhd et</button>}</div>);
}
