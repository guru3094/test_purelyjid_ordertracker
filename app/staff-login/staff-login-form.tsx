"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export default function StaffLoginForm({ destination }: { destination: "/sales/create" | "/cricut_svg" }) {
  const router = useRouter(); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setError(""); setLoading(true); const f=new FormData(e.currentTarget);
    const r=await fetch("/api/staff/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:f.get("username"),password:f.get("password")})});
    const d=await r.json(); setLoading(false); if(!r.ok){setError(d.error??"Login failed.");return;} router.replace(destination); router.refresh(); }
  return <main className="staff-shell"><section className="staff-card staff-login-card"><img src="/purelyjid-logo.png" alt="PurelyJid" className="staff-logo"/><h1>Staff Order Portal</h1><p>{destination === "/cricut_svg" ? "Sign in to open the Cricut SVG Generator." : "Sign in to create customer orders."}</p><form onSubmit={submit} className="staff-form"><label>Username<input name="username" required autoComplete="username"/></label><label>Password<input name="password" type="password" required autoComplete="current-password"/></label>{error&&<div className="staff-error">{error}</div>}<button disabled={loading}>{loading?"Signing in...":"Sign in"}</button></form></section></main>;
}
