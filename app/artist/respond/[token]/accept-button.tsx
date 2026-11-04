"use client";
import { useState } from "react";

export default function AcceptButton({ token }: { token: string }) {
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function accept() {
    setLoading(true); setError(""); setMessage("");
    try {
      const r=await fetch("/api/artist/respond",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error??"Could not accept this order.");
      setMessage(d.message);
      if (d.notifyUrl) window.location.assign(d.notifyUrl);
    } catch(e) {
      setError(e instanceof Error?e.message:"Could not accept this order.");
    } finally { setLoading(false); }
  }

  if(message) return <div className="artist-response-success">{message}</div>;
  return <div>
    <button type="button" className="artist-accept-button" onClick={accept} disabled={loading}>
      {loading?"Accepting...":"Accept Order"}
    </button>
    {error&&<div className="artist-response-error">{error}</div>}
  </div>;
}
