"use client";
import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NotificationBanner() {
  const { permission, isSubscribed, isLoading, isSupported, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { if (sessionStorage.getItem("push-banner-dismissed")) return; } catch(e) {}
      if (isSupported && !isSubscribed && permission !== "denied") setShow(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission]);

  if (!show || dismissed || isSubscribed || permission === "denied") return null;

  return (
    <div style={{ position:"fixed", bottom:"20px", right:"20px", maxWidth:"380px", background:"white", borderRadius:"12px", boxShadow:"0 4px 24px rgba(0,0,0,0.12)", padding:"16px 20px", zIndex:9999, border:"1px solid #e5e7eb" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
        <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:"linear-gradient(135deg, #7c3aed, #6d28d9)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"white", fontSize:"18px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontWeight:600, fontSize:"14px", color:"#111827" }}>Enable Notifications</p>
          <p style={{ margin:"4px 0 12px", fontSize:"13px", color:"#6b7280", lineHeight:"1.4" }}>Get instant alerts for new messages, contracts, and updates.</p>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={async()=>{await subscribe();setShow(false);}} disabled={isLoading} style={{ padding:"8px 16px", borderRadius:"8px", border:"none", background:"linear-gradient(135deg, #7c3aed, #6d28d9)", color:"white", fontSize:"13px", fontWeight:500, cursor:isLoading?"wait":"pointer" }}>
              {isLoading ? "Enabling..." : "Enable"}
            </button>
            <button onClick={()=>{setDismissed(true);setShow(false);try{sessionStorage.setItem("push-banner-dismissed","1");}catch(e){}}} style={{ padding:"8px 16px", borderRadius:"8px", border:"1px solid #e5e7eb", background:"white", color:"#6b7280", fontSize:"13px", cursor:"pointer" }}>
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
