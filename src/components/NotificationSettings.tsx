"use client";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NotificationSettings() {
  const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return <div style={{ padding:"12px 16px", background:"#fef3c7", borderRadius:"8px", fontSize:"14px", color:"#92400e" }}>Push notifications are not supported in this browser.</div>;
  }
  if (permission === "denied") {
    return <div style={{ padding:"12px 16px", background:"#fee2e2", borderRadius:"8px", fontSize:"14px", color:"#991b1b" }}>Notifications are blocked. Please enable them in your browser settings.</div>;
  }

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0" }}>
      <div>
        <p style={{ margin:0, fontWeight:500, fontSize:"14px" }}>Push Notifications</p>
        <p style={{ margin:"2px 0 0", fontSize:"13px", color:"#6b7280" }}>{isSubscribed ? "You will receive browser notifications" : "Enable to get notified of new messages and updates"}</p>
      </div>
      <button onClick={isSubscribed ? unsubscribe : subscribe} disabled={isLoading}
        style={{ padding:"8px 20px", borderRadius:"8px", border:isSubscribed?"1px solid #e5e7eb":"none", background:isSubscribed?"white":"linear-gradient(135deg, #7c3aed, #6d28d9)", color:isSubscribed?"#374151":"white", fontSize:"13px", fontWeight:500, cursor:isLoading?"wait":"pointer", opacity:isLoading?0.7:1 }}>
        {isLoading ? "..." : isSubscribed ? "Disable" : "Enable"}
      </button>
    </div>
  );
}
