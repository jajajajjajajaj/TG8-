import { useEffect, useState } from "react";

// 색상은 CSS 변수로 두고, 테마(data-theme)에 따라 값이 바뀝니다.
export const C = {
  bg:"var(--bg)", panel:"var(--panel)", line:"var(--line)", lineSoft:"var(--line-soft)",
  ink:"var(--ink)", dim:"var(--dim)",
  brass:"var(--accent)", brassSoft:"var(--accent-soft)", brassTint:"var(--accent-tint)", onAccent:"var(--on-accent)",
  ok:"var(--ok)", bad:"var(--bad)", warn:"var(--warn)", field:"var(--field)",
};

// 어두운 버전: 네이비 / 밝은 버전: 아주 연한 하늘색
export const THEME_CSS = `
:root, [data-theme="dark"] {
  --bg:#0F1A2E; --panel:#17253F; --line:#2E4368; --line-soft:#2E436866;
  --ink:#EAF0FA; --dim:#A3B3CC;
  --accent:#F2C35B; --accent-soft:#F2C35B80; --accent-tint:#F2C35B1F; --on-accent:#0F1A2E;
  --ok:#5ED49B; --bad:#FF8A76; --warn:#F5C451; --field:#0A1324;
  color-scheme: dark;
}
[data-theme="light"] {
  --bg:#EDF6FD; --panel:#FFFFFF; --line:#B9D3EA; --line-soft:#B9D3EA80;
  --ink:#10243D; --dim:#4F6987;
  --accent:#1E5EAA; --accent-soft:#1E5EAA80; --accent-tint:#1E5EAA14; --on-accent:#FFFFFF;
  --ok:#178A55; --bad:#C6382A; --warn:#A8690E; --field:#F3F8FD;
  color-scheme: light;
}
html, body { background: var(--bg); color: var(--ink); }
input, select, button { color-scheme: inherit; }
`;

const THEME_KEY = "tg8_theme";
export function useTheme(){
  const [theme,setTheme] = useState(()=>{
    try{ const t=localStorage.getItem(THEME_KEY); if(t==="light"||t==="dark") return t; }catch{}
    try{ if(window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light"; }catch{}
    return "dark";
  });
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", theme);
    try{ localStorage.setItem(THEME_KEY, theme); }catch{}
  },[theme]);
  return [theme, ()=>setTheme(t=>t==="dark"?"light":"dark")];
}
export const font = "'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif";
export const num = { fontVariantNumeric:"tabular-nums" };

export const panel = { background:C.panel, border:`1px solid ${C.line}`, borderRadius:10, padding:16 };
export const h2 = { fontSize:15, fontWeight:700, color:C.ink, margin:"0 0 10px" };
export const th = { padding:"6px 8px", fontSize:12, fontWeight:600, color:C.dim, borderBottom:`1px solid ${C.line}`, whiteSpace:"nowrap", textAlign:"right" };
export const td = { padding:"5px 8px", fontSize:13, borderBottom:`1px solid ${C.lineSoft}`, textAlign:"right", whiteSpace:"nowrap", ...num };
export const tdL = { ...td, textAlign:"left" };
export const btn = { background:C.field, color:C.ink, border:`1px solid ${C.line}`, borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer", fontFamily:"inherit" };
export const btnPrimary = { ...btn, background:C.brass, color:C.onAccent, fontWeight:700, padding:"8px 16px", fontSize:14 };
export const input = { background:C.field, color:C.brass, border:`1px solid ${C.line}`, borderRadius:6, padding:"6px 8px", fontSize:15, fontFamily:font, ...num };

export const fmt = (v,d=1)=> (Math.round(v*10**d)/10**d).toLocaleString("ko-KR",{minimumFractionDigits:d,maximumFractionDigits:d});
export const fmt0 = v=> Math.round(v).toLocaleString("ko-KR");
export const dhm = min => { const m=Math.max(0,Math.round(min)); return `${Math.floor(m/1440)}일 ${Math.floor(m%1440/60)}시간 ${m%60}분`; };

export function NumInput({value,onChange,step=1,w=110,suffix}) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
      <input type="number" step={step} value={value}
        onChange={e=>onChange(e.target.value===""?0:parseFloat(e.target.value))}
        style={{...input,width:w,textAlign:"right"}}/>
      {suffix && <span style={{color:C.dim,fontSize:13}}>{suffix}</span>}
    </span>
  );
}
