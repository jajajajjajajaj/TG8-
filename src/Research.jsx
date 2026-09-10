import { useEffect, useMemo, useState } from "react";
import { C, num, panel, h2, th, td, tdL, btn, btnPrimary, input, dhm, NumInput } from "./ui.jsx";
import { TECHS, TECH_BY_ID, TIERS, RES, RES_KO, RES_UNIT, RES_SCALE, levelCost, effectAt, prereqLevel } from "./research/data.js";
import { simulate, planGoal, allowedSet, unlockStatus, emptyRes } from "./research/engine.js";

const STORE_KEY = "tg8_research_v1";
const GROUPS = ["전체","보병","기병","궁병"];

const fmtRes = (r,v) => {
  const x = v/RES_SCALE[r];
  if (RES_SCALE[r]===1) return Math.round(x).toLocaleString("ko-KR");
  return (Math.round(x*100)/100).toLocaleString("ko-KR",{minimumFractionDigits:0,maximumFractionDigits:2});
};
const fmtCost = c => RES.filter(r=>c[r]>0).map(r=>`${RES_KO[r]} ${fmtRes(r,c[r])}${RES_UNIT[r]==="M"?"M":""}`).join(" · ");

function load(){ try{ const s=JSON.parse(localStorage.getItem(STORE_KEY)); if(s) return s; }catch{} return null; }

export default function Research(){
  const saved = useMemo(load,[]);
  const [tg,setTg] = useState(saved?.tg ?? 6);
  const [speed,setSpeed] = useState(saved?.speed ?? 0);
  const [have,setHave] = useState(saved?.have ?? Object.fromEntries(RES.map(r=>[r,0])));   // 입력 단위 (M / 개)
  const [levels,setLevels] = useState(saved?.levels ?? {});
  const [strategy,setStrategy] = useState(saved?.strategy ?? "even");
  const [group,setGroup] = useState(saved?.group ?? "전체");
  const [tab,setTab] = useState("sim");
  const [goalId,setGoalId] = useState(saved?.goalId ?? "mauls1");
  const [goalLv,setGoalLv] = useState(saved?.goalLv ?? 10);
  const [showLevels,setShowLevels] = useState(true);
  const [refId,setRefId] = useState("mauls1");

  useEffect(()=>{ try{ localStorage.setItem(STORE_KEY, JSON.stringify({tg,speed,have,levels,strategy,group,goalId,goalLv})); }catch{} },
    [tg,speed,have,levels,strategy,group,goalId,goalLv]);

  const haveRaw = useMemo(()=>Object.fromEntries(RES.map(r=>[r,(have[r]||0)*RES_SCALE[r]])),[have]);
  const sim = useMemo(()=>simulate({levels,have:haveRaw,tg,strategy,allowed:allowedSet(group),speed}),[levels,haveRaw,tg,strategy,group,speed]);
  const goal = useMemo(()=>planGoal({levels,targetId:goalId,targetLevel:goalLv,speed}),[levels,goalId,goalLv,speed]);
  const goalShort = useMemo(()=>RES.map(r=>({r,need:goal.total[r],have:haveRaw[r],left:haveRaw[r]-goal.total[r]})),[goal,haveRaw]);
  const goalOK = goalShort.every(x=>x.left>=-1e-6) && tg>=goal.tgReq;

  const setLv = (id,v)=> setLevels(l=>({...l,[id]:Math.max(0,Math.min(TECH_BY_ID[id].maxLevel, Math.floor(Number(v)||0)))}));
  const setTierAll = (tier,v)=> setLevels(l=>{ const n={...l}; TECHS.filter(t=>t.tier===tier).forEach(t=>n[t.id]=Math.min(t.maxLevel,v)); return n; });
  const applySim = ()=>{ setLevels(sim.levels); setHave(Object.fromEntries(RES.map(r=>[r,sim.remaining[r]/RES_SCALE[r]]))); };

  const refTech = TECH_BY_ID[refId];
  const goalTech = TECH_BY_ID[goalId];

  return (
    <>
      {/* 요약 */}
      <div style={{...panel,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:16,borderColor:C.brass+"66"}}>
        <div><div style={sub}>지금 자원으로 올릴 수 있는 레벨 수</div>
          <div style={{fontSize:26,fontWeight:800,color:C.brass,...num}}>{sim.steps.length}단계</div>
          <div style={{...sub,...num}}>{strategy==="even"?"낮은 레벨부터 고르게":"트리 순서대로"} · {group}</div></div>
        <div><div style={sub}>총 연구 시간 (가속 {speed}% 적용)</div>
          <div style={{fontSize:20,fontWeight:700,...num}}>{dhm(sim.minutes)}</div></div>
        <div><div style={sub}>가장 먼저 바닥나는 자원</div>
          <div style={{fontSize:20,fontWeight:700,color:C.bad}}>{firstBlocker(sim)}</div></div>
        <div><div style={sub}>남는 자원</div>
          <div style={{fontSize:12,lineHeight:1.6,...num}}>{RES.map(r=><span key={r} style={{marginRight:8}}>{RES_KO[r]} {fmtRes(r,sim.remaining[r])}{RES_UNIT[r]==="M"?"M":""}</span>)}</div></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"minmax(280px,340px) 1fr",gap:16,alignItems:"start"}} className="tg8grid">
        {/* ── 입력 */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <section style={panel}>
            <h2 style={h2}>조건</h2>
            <div style={{display:"grid",gap:10}}>
              <label style={row}><span>전쟁아카데미 TG 레벨<div style={sub}>TG5: 기본 · TG6: I~II · TG7: III~IV · TG8: V~VI</div></span>
                <select value={tg} onChange={e=>setTg(+e.target.value)} style={sel}>{[5,6,7,8].map(n=><option key={n} value={n}>TG{n}</option>)}</select></label>
              <label style={row}><span>연구 속도 보너스<div style={sub}>시간 계산에만 영향</div></span>
                <NumInput value={speed} onChange={setSpeed} step={0.1} w={80} suffix="%"/></label>
              <label style={row}><span>시뮬 방식</span>
                <select value={strategy} onChange={e=>setStrategy(e.target.value)} style={sel}>
                  <option value="even">낮은 레벨부터 고르게</option><option value="order">트리 순서대로 끝내기</option></select></label>
              <label style={row}><span>집중 병종<div style={sub}>경제·부대 연구는 항상 포함</div></span>
                <select value={group} onChange={e=>setGroup(e.target.value)} style={sel}>{GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2}>보유 자원</h2>
            <div style={{display:"grid",gap:8}}>
              {RES.map(r=>(
                <label key={r} style={row}><span>{RES_KO[r]}</span>
                  <NumInput value={have[r]} onChange={v=>setHave(h=>({...h,[r]:v}))} step={RES_SCALE[r]===1?1:0.1} w={120} suffix={RES_UNIT[r]}/></label>
              ))}
            </div>
            <div style={{...sub,marginTop:8}}>빵·목재·석재·철광·골드는 백만(M) 단위, 순금 가루·정련 순금은 개수.</div>
          </section>

          <section style={panel}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <h2 style={h2}>현재 연구 레벨</h2>
              <button style={btn} onClick={()=>setShowLevels(s=>!s)}>{showLevels?"접기":"펼치기"}</button>
            </div>
            {showLevels && TIERS.map(tier=>{
              const list=TECHS.filter(t=>t.tier===tier); if(!list.length) return null;
              return (
                <div key={tier} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.brass}}>{tier==="기본"?"기본 (경제)":tier==="최종"?"최종":`티어 ${tier}`} <span style={sub}>TG{list[0].tg}</span></div>
                    {tier!=="최종" && <div style={{display:"flex",gap:4}}>
                      {[0,10].map(v=><button key={v} style={{...btn,padding:"1px 6px",fontSize:11}} onClick={()=>setTierAll(tier,v)}>전체 {v}</button>)}
                    </div>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 8px"}}>
                    {list.map(t=>(
                      <label key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:4,fontSize:12}}>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={`${t.en} · ${t.effect}`}>{t.ko}</span>
                        <input type="number" min={0} max={t.maxLevel} value={levels[t.id]||0} onChange={e=>setLv(t.id,e.target.value)}
                          style={{...input,width:46,padding:"2px 4px",fontSize:12,textAlign:"right"}}/>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        {/* ── 결과 */}
        <div style={{display:"flex",flexDirection:"column",gap:16,minWidth:0}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["sim","시뮬레이션"],["goal","목표까지 필요 자원"],["ref","연구 기준표"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{...btn,...(tab===k?{background:C.brass,color:"#1A1F17",fontWeight:700}:{})}}>{l}</button>
            ))}
          </div>

          {tab==="sim" && (<>
            <section style={{...panel,overflowX:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",flexWrap:"wrap",gap:8}}>
                <h2 style={h2}>올릴 수 있는 순서 ({sim.steps.length}단계)</h2>
                {sim.steps.length>0 && <button style={btn} onClick={applySim} title="시뮬 결과를 현재 레벨·잔여 자원으로 반영">결과를 현재 상태로 반영</button>}
              </div>
              {sim.steps.length===0 ? <div style={{color:C.dim,fontSize:13}}>지금 조건으로는 올릴 수 있는 연구가 없습니다. 아래 막힌 이유를 확인하세요.</div> :
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>#</th><th style={{...th,textAlign:"left"}}>연구</th><th style={th}>레벨</th><th style={th}>효과</th><th style={{...th,textAlign:"left"}}>비용</th><th style={th}>시간</th></tr></thead>
                <tbody>{sim.steps.map((s,i)=>(
                  <tr key={i}><td style={tdL}>{i+1}</td><td style={tdL}>{s.ko}</td><td style={td}>{s.L-1}→{s.L}</td><td style={td}>{effectAt(TECH_BY_ID[s.id],s.L)}</td>
                    <td style={{...tdL,whiteSpace:"normal",fontSize:12,color:C.dim}}>{fmtCost(s.cost)}</td><td style={td}>{dhm(s.minutes)}</td></tr>
                ))}</tbody>
              </table>}
            </section>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>사용 / 잔여 자원</h2>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>자원</th><th style={th}>보유</th><th style={th}>사용</th><th style={th}>잔여</th></tr></thead>
                <tbody>{RES.map(r=><tr key={r}><td style={tdL}>{RES_KO[r]}</td><td style={td}>{fmtRes(r,haveRaw[r])}</td><td style={td}>{fmtRes(r,sim.spent[r])}</td>
                  <td style={{...td,color:sim.remaining[r]<=0?C.bad:C.ok}}>{fmtRes(r,sim.remaining[r])}</td></tr>)}</tbody>
              </table>
            </section>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>다음에 막히는 연구 (해금됐지만 자원 부족)</h2>
              {sim.blockers.length===0 ? <div style={{color:C.dim,fontSize:13}}>{tg<8?"해금된 연구가 더 없습니다. TG 레벨이나 선행 연구를 확인하세요.":"모든 해금 연구를 올렸습니다."}</div> :
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>연구</th><th style={th}>다음 레벨</th><th style={{...th,textAlign:"left"}}>부족한 자원</th><th style={{...th,textAlign:"left"}}>비용</th></tr></thead>
                <tbody>{sim.blockers.slice(0,20).map(b=>(
                  <tr key={b.t.id}><td style={tdL}>{b.t.ko}</td><td style={td}>{b.L}</td>
                    <td style={{...tdL,color:C.bad}}>{b.short.map(r=>`${RES_KO[r]} ${fmtRes(r,b.cost[r]-sim.remaining[r])}${RES_UNIT[r]==="M"?"M":""} 부족`).join(", ")}</td>
                    <td style={{...tdL,whiteSpace:"normal",fontSize:12,color:C.dim}}>{fmtCost(b.cost)}</td></tr>
                ))}</tbody>
              </table>}
            </section>
          </>)}

          {tab==="goal" && (<>
            <section style={panel}>
              <h2 style={h2}>목표 설정</h2>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <select value={goalId} onChange={e=>{setGoalId(e.target.value); setGoalLv(l=>Math.min(l,TECH_BY_ID[e.target.value].maxLevel));}} style={{...sel,minWidth:220}}>
                  {TIERS.map(tier=><optgroup key={tier} label={tier==="기본"?"기본 (경제)":tier==="최종"?"최종":`티어 ${tier}`}>
                    {TECHS.filter(t=>t.tier===tier).map(t=><option key={t.id} value={t.id}>{t.ko} — {t.effect}</option>)}</optgroup>)}
                </select>
                <span>Lv.</span>
                <input type="number" min={1} max={goalTech.maxLevel} value={goalLv} onChange={e=>setGoalLv(Math.max(1,Math.min(goalTech.maxLevel,+e.target.value||1)))} style={{...input,width:70,textAlign:"right"}}/>
                <span style={sub}>현재 {levels[goalId]||0} → 목표 {goalLv} · 효과 {effectAt(goalTech,goalLv)} · TG{goal.tgReq} 필요</span>
              </div>
              <div style={{marginTop:10,fontSize:15,fontWeight:700,color:goalOK?C.ok:C.bad}}>
                {goalOK ? "지금 자원으로 달성 가능" : tg<goal.tgReq ? `전쟁아카데미 TG${goal.tgReq}가 필요합니다` : "자원이 부족합니다"}
                <span style={{...sub,marginLeft:10}}>총 연구 시간 {dhm(goal.minutes)}</span>
              </div>
            </section>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>필요 자원 합계 (선행 연구 포함)</h2>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>자원</th><th style={th}>필요</th><th style={th}>보유</th><th style={th}>잔여</th><th style={th}>판정</th></tr></thead>
                <tbody>{goalShort.map(x=><tr key={x.r}><td style={tdL}>{RES_KO[x.r]}</td><td style={td}>{fmtRes(x.r,x.need)}</td><td style={td}>{fmtRes(x.r,x.have)}</td>
                  <td style={{...td,color:x.left<0?C.bad:C.ok}}>{fmtRes(x.r,x.left)}</td><td style={{...td,color:x.left<0?C.bad:C.ok,fontWeight:700}}>{x.left<0?"부족":"가능"}</td></tr>)}</tbody>
              </table>
            </section>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>올려야 하는 연구 ({goal.items.length}개)</h2>
              {goal.items.length===0 ? <div style={{color:C.dim,fontSize:13}}>이미 목표 레벨입니다.</div> :
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>연구</th><th style={th}>레벨</th>{RES.map(r=><th key={r} style={th}>{RES_KO[r]}</th>)}<th style={th}>시간</th></tr></thead>
                <tbody>{goal.items.map(it=><tr key={it.id}><td style={tdL}>{it.ko}</td><td style={td}>{it.from}→{it.to}</td>
                  {RES.map(r=><td key={r} style={td}>{fmtRes(r,it.cost[r])}</td>)}<td style={td}>{dhm(it.minutes)}</td></tr>)}
                  <tr style={{fontWeight:700,color:C.brass}}><td style={tdL}>합계</td><td style={td}></td>{RES.map(r=><td key={r} style={td}>{fmtRes(r,goal.total[r])}</td>)}<td style={td}>{dhm(goal.minutes)}</td></tr>
                </tbody>
              </table>}
            </section>
          </>)}

          {tab==="ref" && (
            <section style={{...panel,overflowX:"auto"}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"baseline"}}>
                <h2 style={h2}>연구 기준표</h2>
                <select value={refId} onChange={e=>setRefId(e.target.value)} style={{...sel,minWidth:220}}>
                  {TIERS.map(tier=><optgroup key={tier} label={tier==="기본"?"기본 (경제)":tier==="최종"?"최종":`티어 ${tier}`}>
                    {TECHS.filter(t=>t.tier===tier).map(t=><option key={t.id} value={t.id}>{t.ko}</option>)}</optgroup>)}
                </select>
              </div>
              <div style={{...sub,margin:"4px 0 10px"}}>{refTech.en} · {refTech.effect} · TG{refTech.tg} · 선행: {refTech.prereqs.length?refTech.prereqs.map(p=>TECH_BY_ID[p].ko).join(", "):"없음"}
                {refTech.prereqs.length>0 && refTech.id!=="prov3" && " (레벨별 요구: 1,1,3,3,3,6,6,6,6,10)"}</div>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={th}>Lv</th><th style={th}>효과</th>{RES.map(r=><th key={r} style={th}>{RES_KO[r]}{RES_UNIT[r]==="M"?"(M)":""}</th>)}<th style={th}>기본 시간</th></tr></thead>
                <tbody>{Array.from({length:Math.min(refTech.maxLevel,100)},(_,i)=>i+1).map(L=>{const c=levelCost(refTech,L); return (
                  <tr key={L} style={{opacity:(levels[refId]||0)>=L?0.45:1}}><td style={td}>{L}</td><td style={td}>{effectAt(refTech,L)}</td>
                    {RES.map(r=><td key={r} style={td}>{fmtRes(r,c[r])}</td>)}<td style={td}>{dhm(c.minutes)}</td></tr>);})}
                </tbody>
              </table>
            </section>
          )}

          <section style={{...panel,fontSize:12,color:C.dim,lineHeight:1.7}}>
            <b style={{color:C.ink}}>참고</b> 수치는 kingshotdata.com / kingshot.net 공개 데이터 기준이며 게임 업데이트로 달라질 수 있습니다.
            티어 VI 10레벨 순금 가루(원본 표기 1.0K)와 순금 보급 III 일부 값은 공개 표의 반올림값에서 추정했습니다.
            한글 연구명은 번역이라 게임 내 표기와 다를 수 있습니다(영문명은 기준표 탭에서 확인).
          </section>
        </div>
      </div>
    </>
  );
}

function firstBlocker(sim){
  if (!sim.blockers.length) return "없음";
  const cnt={}; sim.blockers.forEach(b=>b.short.forEach(r=>cnt[r]=(cnt[r]||0)+1));
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
  return top?RES_KO[top[0]]:"없음";
}

const row = {display:"flex",justifyContent:"space-between",alignItems:"center",gap:8};
const sub = {fontSize:11,color:C.dim};
const sel = {background:C.field,color:C.brass,border:`1px solid ${C.line}`,borderRadius:6,padding:"5px 8px",fontFamily:"inherit",fontSize:13};
