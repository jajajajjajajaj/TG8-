export const C = {
  bg:"#232820", panel:"#2E3529", line:"#4A5342", ink:"#EAE4D2", dim:"#A5AA97",
  brass:"#D4B066", ok:"#8FBF73", bad:"#E0714F", warn:"#E2B95A", field:"#1A1F17",
};
export const font = "'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif";
export const num = { fontVariantNumeric:"tabular-nums" };

export const panel = { background:C.panel, border:`1px solid ${C.line}`, borderRadius:10, padding:16 };
export const h2 = { fontSize:15, fontWeight:700, color:C.ink, margin:"0 0 10px" };
export const th = { padding:"6px 8px", fontSize:12, fontWeight:600, color:C.dim, borderBottom:`1px solid ${C.line}`, whiteSpace:"nowrap", textAlign:"right" };
export const td = { padding:"5px 8px", fontSize:13, borderBottom:`1px solid ${C.line}44`, textAlign:"right", whiteSpace:"nowrap", ...num };
export const tdL = { ...td, textAlign:"left" };
export const btn = { background:C.field, color:C.ink, border:`1px solid ${C.line}`, borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer", fontFamily:"inherit" };
export const btnPrimary = { ...btn, background:C.brass, color:"#1A1F17", fontWeight:700, padding:"8px 16px", fontSize:14 };
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
