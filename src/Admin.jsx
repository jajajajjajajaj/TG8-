import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";
import { C, panel, h2, th, td, tdL, btn, btnPrimary, input } from "./ui.jsx";

const COST_COLS = [
  ["gold","순금"],["refined_gold","정련순금"],["food","식량(M)"],["wood","목재(M)"],
  ["stone","석재(M)"],["iron","철광(M)"],["minutes_per_upgrade","1건 시간(분)"],
];
const BOX_COLS = [["lv1","1렙"],["lv2","2렙"],["lv3","3렙"]];

export default function Admin({ costs: initialCosts, boxes: initialBoxes, onSaved, onClose }) {
  const [session,setSession] = useState(null);
  const [email,setEmail] = useState("");
  const [pw,setPw] = useState("");
  const [msg,setMsg] = useState("");
  const [busy,setBusy] = useState(false);
  const [costs,setCosts] = useState(initialCosts);
  const [boxes,setBoxes] = useState(initialBoxes);

  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const { data:{subscription} } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  if(!supabase) return (
    <div style={panel}>Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않아 관리자 기능을 쓸 수 없습니다.
      <div style={{marginTop:10}}><button style={btn} onClick={onClose}>계산기로 돌아가기</button></div></div>
  );

  const login = async e => {
    e.preventDefault(); setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false); if(error) setMsg("로그인 실패: "+error.message);
  };
  const logout = async ()=>{ await supabase.auth.signOut(); };

  const setCost = (id,col,v)=> setCosts(cs=>cs.map(r=>r.id===id?{...r,[col]:v}:r));
  const setBox = (res,col,v)=> setBoxes(bs=>bs.map(b=>b.resource===res?{...b,[col]:v}:b));

  const save = async ()=>{
    setBusy(true); setMsg("");
    const costRows = costs.map(r=>({ ...r, ...Object.fromEntries(COST_COLS.map(([c])=>[c, Number(r[c])||0])) }));
    const boxRows = boxes.map(b=>({ ...b, ...Object.fromEntries(BOX_COLS.map(([c])=>[c, Number(b[c])||0])) }));
    const r1 = await supabase.from("tg8_costs").upsert(costRows, { onConflict:"id" });
    const r2 = await supabase.from("tg8_box_values").upsert(boxRows, { onConflict:"resource" });
    setBusy(false);
    if(r1.error||r2.error){ setMsg("저장 실패: "+(r1.error||r2.error).message+" (관리자 권한이 없거나 RLS 정책을 확인하세요)"); return; }
    setMsg("저장했습니다."); onSaved && onSaved(costRows, boxRows);
  };

  if(!session) return (
    <section style={{...panel,maxWidth:380}}>
      <h2 style={h2}>관리자 로그인</h2>
      <form onSubmit={login} style={{display:"grid",gap:8}}>
        <input type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} style={{...input,color:C.ink}} required/>
        <input type="password" placeholder="비밀번호" value={pw} onChange={e=>setPw(e.target.value)} style={{...input,color:C.ink}} required/>
        <button type="submit" style={btnPrimary} disabled={busy}>{busy?"확인 중…":"로그인"}</button>
        {msg && <div style={{color:C.bad,fontSize:13}}>{msg}</div>}
      </form>
      <div style={{marginTop:10}}><button style={btn} onClick={onClose}>계산기로 돌아가기</button></div>
    </section>
  );

  const cell = (val,onChange,step="any")=>(
    <input type="number" step={step} value={val} onChange={e=>onChange(e.target.value)}
      style={{...input,width:86,padding:"3px 6px",fontSize:13,textAlign:"right"}}/>
  );

  return (
    <div style={{display:"grid",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{color:C.dim,fontSize:13}}>{session.user.email} 로 로그인됨</div>
        <div style={{display:"flex",gap:8}}>
          <button style={btn} onClick={logout}>로그아웃</button>
          <button style={btn} onClick={onClose}>계산기로</button>
          <button style={btnPrimary} onClick={save} disabled={busy}>{busy?"저장 중…":"변경사항 저장"}</button>
        </div>
      </div>
      {msg && <div style={{color:msg.startsWith("저장했")?C.ok:C.bad,fontSize:13}}>{msg}</div>}

      <section style={{...panel,overflowX:"auto"}}>
        <h2 style={h2}>건설 기준표 (원본 수치 · 할인·가속 적용 전)</h2>
        <table style={{borderCollapse:"collapse",width:"100%"}}>
          <thead><tr><th style={{...th,textAlign:"left"}}>건물</th><th style={{...th,textAlign:"left"}}>구간</th>
            {COST_COLS.map(([c,l])=><th key={c} style={th}>{l}</th>)}</tr></thead>
          <tbody>{costs.map(r=>(
            <tr key={r.id}><td style={tdL}>{r.building}</td><td style={tdL}>{r.stage}</td>
              {COST_COLS.map(([c])=><td key={c} style={td}>{cell(r[c],v=>setCost(r.id,c,v))}</td>)}</tr>
          ))}</tbody>
        </table>
      </section>

      <section style={{...panel,overflowX:"auto",maxWidth:520}}>
        <h2 style={h2}>자원 선택 상자 — 1개당 지급량 (M)</h2>
        <table style={{borderCollapse:"collapse",width:"100%"}}>
          <thead><tr><th style={{...th,textAlign:"left"}}>자원</th>{BOX_COLS.map(([c,l])=><th key={c} style={th}>{l}</th>)}</tr></thead>
          <tbody>{boxes.map(b=>(
            <tr key={b.resource}><td style={tdL}>{b.resource}</td>
              {BOX_COLS.map(([c])=><td key={c} style={td}>{cell(b[c],v=>setBox(b.resource,c,v))}</td>)}</tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  );
}
