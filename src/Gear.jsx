import { useEffect, useMemo, useState } from "react";
import { C, num, panel, h2, th, td, tdL, btn, fmt0, NumInput } from "./ui.jsx";

// ── 영주 장비 강화표 (레벨 1~58). 출처: kingshotdata.com / kingshotoptimizer.com (kingshotdata.kr 대조)
//    [등급명, 능력치(%), 비단, 금사, 설계 스케치]  — 각 행은 "그 레벨로 올릴 때" 드는 재료
const G = (name, stat, silk, thread, sketch) => ({ name, stat, silk, thread, sketch });
export const GEAR_LEVELS = [
  G("고급",9.35,1500,15,0), G("고급 ★",12.75,3800,40,0),
  G("레어",17,7000,70,0), G("레어 ★",21.25,9700,95,0), G("레어 ★★",25.5,1000,10,45), G("레어 ★★★",29.75,1000,10,50),
  G("에픽",34,1500,15,60), G("에픽 ★",36.89,1500,15,70), G("에픽 ★★",39.78,6500,65,40), G("에픽 ★★★",42.67,8000,80,50),
  G("에픽 T1",45.56,10000,95,60), G("에픽 T1 ★",48.45,11000,110,70), G("에픽 T1 ★★",51.34,13000,130,85), G("에픽 T1 ★★★",54.23,15000,160,100),
  G("레전드",56.78,22000,220,40), G("레전드 ★",59.33,23000,230,40), G("레전드 ★★",61.88,25000,250,45), G("레전드 ★★★",64.43,26000,260,45),
  G("레전드 T1",66.98,28000,280,45), G("레전드 T1 ★",69.53,30000,300,55), G("레전드 T1 ★★",72.08,32000,320,55), G("레전드 T1 ★★★",74.63,35000,340,55),
  G("레전드 T2",77.18,38000,360,55), G("레전드 T2 ★",79.73,43000,430,75), G("레전드 T2 ★★",82.28,45000,460,80), G("레전드 T2 ★★★",84.83,48000,500,85),
  G("레전드 T3",87.38,60000,600,120), G("레전드 T3 ★",89.93,70000,700,140), G("레전드 T3 ★★",92.48,80000,800,160), G("레전드 T3 ★★★",95,90000,900,180),
  G("신화",97.5,108000,1080,220), G("신화 ★",100,114000,1140,230), G("신화 ★★",102.5,121000,1210,240), G("신화 ★★★",105,128000,1280,250),
  G("신화 T1",107.5,154000,1540,300), G("신화 T1 ★",110,163000,1630,320), G("신화 T1 ★★",112.5,173000,1730,340), G("신화 T1 ★★★",115,183000,1830,360),
  G("신화 T2",117.5,220000,2200,430), G("신화 T2 ★",120,233000,2330,460), G("신화 T2 ★★",122.5,247000,2470,490), G("신화 T2 ★★★",125,262000,2620,520),
  G("신화 T3",127.75,288000,2880,570), G("신화 T3 ★",130.5,302000,3020,600), G("신화 T3 ★★",133.25,317000,3170,630), G("신화 T3 ★★★",136,333000,3330,660),
  G("신화 T4",138.75,366000,3660,730), G("신화 T4 ★",141.5,384000,3840,770), G("신화 T4 ★★",144.25,403000,4030,810), G("신화 T4 ★★★",147,423000,4230,850),
  G("신화 T5",150,465000,4650,940), G("신화 T5 ★",153,479000,4790,970), G("신화 T5 ★★",156,493000,4930,1000), G("신화 T5 ★★★",159,508000,5080,1030),
  G("신화 T6",162,549000,5490,1110), G("신화 T6 ★",165,565000,5650,1140), G("신화 T6 ★★",168,582000,5820,1170), G("신화 T6 ★★★",171,599000,5990,1210),
];
export const GEAR_MAX = GEAR_LEVELS.length; // 58
export const GEAR_MATS = [["silk","비단"],["thread","금사"],["sketch","설계 스케치"]];
// 부위 → 병종: 갑옷·다리 = 보병, 머리·장신구 = 기병, 지팡이·반지 = 궁병
export const GEAR_SLOTS = [
  { name:"갑옷", troop:"보병" }, { name:"다리", troop:"보병" },
  { name:"머리", troop:"기병" }, { name:"장신구", troop:"기병" },
  { name:"지팡이", troop:"궁병" }, { name:"반지", troop:"궁병" },
];
const TROOP_COLOR = { 보병:"#E07A5F", 기병:"#3D9970", 궁병:"#5B8DEF" };
const Troop = ({t}) => <span style={{fontSize:11,fontWeight:700,color:TROOP_COLOR[t],border:`1px solid ${TROOP_COLOR[t]}66`,borderRadius:4,padding:"0 5px",marginLeft:6}}>{t}</span>;

// ── 영주 보석 강화표 (레벨 1~22). 출처: kingshotdata.com / kingshotdata.kr / kingshotmastery (3곳 일치)
//    [능력치 증가(%), 보석 매뉴얼, 보석 도면]
const CH = (stat, manual, plan) => ({ stat, manual, plan });
export const CHARM_LEVELS = [
  CH(9,5,5), CH(3,40,15), CH(4,60,40), CH(3,80,100), CH(6,100,200), CH(5,120,300), CH(5,140,400), CH(5,200,400), CH(5,300,400), CH(5,420,420), CH(5,560,420),
  CH(4,580,600), CH(4,610,780), CH(4,645,960), CH(4,685,1140), CH(4,730,1320), CH(4,780,1500), CH(4,835,1680), CH(4,895,1860), CH(4,960,2040), CH(4,1030,2220), CH(4,1105,2400),
];
export const CHARM_MAX = CHARM_LEVELS.length; // 22
export const CHARM_MATS = [["manual","보석 매뉴얼"],["plan","보석 도면"]];
export const CHARMS_PER_SLOT = 3;

/** from → to 레벨로 올리는 데 드는 재료 합계 (levels[i] = i+1 레벨로 올릴 때 비용) */
export function costBetween(levels, mats, from, to){
  const o = Object.fromEntries(mats.map(([k])=>[k,0]));
  for (let L=Math.max(0,from)+1; L<=Math.min(to,levels.length); L++) mats.forEach(([k])=> o[k]+=levels[L-1][k]);
  return o;
}
const gearStat = L => L>0 ? GEAR_LEVELS[L-1].stat : 0;
const charmStat = L => { let v=0; for(let i=0;i<L;i++) v+=CHARM_LEVELS[i].stat; return v; };

const STORE_KEY = "tg8_gear_v1";
function load(){ try{ const s=JSON.parse(localStorage.getItem(STORE_KEY)); if(s) return s; }catch{} return null; }
const zeros = n => Array(n).fill(0);

export default function Gear(){
  const saved = useMemo(load,[]);
  const [tab,setTab] = useState(saved?.tab ?? "gear");
  const [gCur,setGCur] = useState(saved?.gCur ?? zeros(6));
  const [gTgt,setGTgt] = useState(saved?.gTgt ?? Array(6).fill(30));
  const [gHave,setGHave] = useState(saved?.gHave ?? {silk:0,thread:0,sketch:0});
  const [cCur,setCCur] = useState(saved?.cCur ?? zeros(18));
  const [cTgt,setCTgt] = useState(saved?.cTgt ?? Array(18).fill(5));
  const [cHave,setCHave] = useState(saved?.cHave ?? {manual:0,plan:0});
  useEffect(()=>{ try{ localStorage.setItem(STORE_KEY, JSON.stringify({tab,gCur,gTgt,gHave,cCur,cTgt,cHave})); }catch{} },[tab,gCur,gTgt,gHave,cCur,cTgt,cHave]);

  const clampG = v => Math.max(0,Math.min(GEAR_MAX,Math.floor(Number(v)||0)));
  const clampC = v => Math.max(0,Math.min(CHARM_MAX,Math.floor(Number(v)||0)));
  const setArr = (setter,clamp) => (i,v) => setter(a=>a.map((x,j)=>j===i?clamp(v):x));
  const setAll = (setter,clamp,n) => v => setter(Array(n).fill(clamp(v)));

  const gear = useMemo(()=>{
    const rows = GEAR_SLOTS.map(({name,troop},i)=>({ name, troop, from:gCur[i], to:gTgt[i], ...costBetween(GEAR_LEVELS,GEAR_MATS,gCur[i],gTgt[i]) }));
    const total = Object.fromEntries(GEAR_MATS.map(([k])=>[k, rows.reduce((a,r)=>a+r[k],0)]));
    return { rows, total };
  },[gCur,gTgt]);
  const charm = useMemo(()=>{
    const rows = cCur.map((from,i)=>({ slot:GEAR_SLOTS[Math.floor(i/CHARMS_PER_SLOT)].name, troop:GEAR_SLOTS[Math.floor(i/CHARMS_PER_SLOT)].troop, n:i%CHARMS_PER_SLOT+1, from, to:cTgt[i], ...costBetween(CHARM_LEVELS,CHARM_MATS,from,cTgt[i]) }));
    const total = Object.fromEntries(CHARM_MATS.map(([k])=>[k, rows.reduce((a,r)=>a+r[k],0)]));
    return { rows, total };
  },[cCur,cTgt]);

  const lvSel = (value,onChange,max,label) => (
    <select value={value} onChange={e=>onChange(+e.target.value)} style={sel}>
      <option value={0}>없음</option>
      {Array.from({length:max},(_,i)=>i+1).map(L=><option key={L} value={L}>{L}{label?` · ${label(L)}`:""}</option>)}
    </select>
  );
  const short = (have,need) => have-need;

  return (
    <>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {[["gear","영주 장비"],["charm","영주 보석"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{...btn,...(tab===k?{background:C.brass,color:C.onAccent,fontWeight:700}:{})}}>{l}</button>))}
      </div>

      {tab==="gear" && (<>
        <div style={{...panel,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:16,borderColor:C.brassSoft}}>
          {GEAR_MATS.map(([k,ko])=>{ const left=short(gHave[k],gear.total[k]); return (
            <div key={k}><div style={sub}>{ko} 필요</div>
              <div style={{fontSize:24,fontWeight:800,color:C.brass,...num}}>{fmt0(gear.total[k])}</div>
              <div style={{...sub,...num,color:left<0?C.bad:C.ok}}>보유 {fmt0(gHave[k])} → {left<0?`${fmt0(-left)} 부족`:`${fmt0(left)} 남음`}</div></div>);})}
          <div><div style={sub}>판정</div>
            <div style={{fontSize:18,fontWeight:800,color:GEAR_MATS.every(([k])=>gHave[k]>=gear.total[k])?C.ok:C.bad}}>
              {GEAR_MATS.every(([k])=>gHave[k]>=gear.total[k])?"모두 충족":"부족 있음"}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(280px,340px) 1fr",gap:16,alignItems:"start"}} className="tg8grid">
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <section style={panel}>
              <h2 style={h2}>보유 재료</h2>
              <div style={{display:"grid",gap:8}}>
                {GEAR_MATS.map(([k,ko])=><label key={k} style={row}><span>{ko}</span><NumInput value={gHave[k]} onChange={v=>setGHave(h=>({...h,[k]:v}))} w={110}/></label>)}
              </div>
            </section>
            <section style={panel}>
              <h2 style={h2}>한꺼번에 설정</h2>
              <div style={{display:"grid",gap:8}}>
                <label style={row}><span>현재 레벨 전체</span>{lvSel(gCur[0],setAll(setGCur,clampG,6),GEAR_MAX,L=>GEAR_LEVELS[L-1].name)}</label>
                <label style={row}><span>목표 레벨 전체</span>{lvSel(gTgt[0],setAll(setGTgt,clampG,6),GEAR_MAX,L=>GEAR_LEVELS[L-1].name)}</label>
              </div>
              <div style={{...sub,marginTop:8}}>부위별로 다르면 오른쪽 표에서 개별로 고치세요. 6부위 모두 강화 비용이 같습니다.</div>
            </section>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16,minWidth:0}}>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>부위별 현재 → 목표</h2>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>부위</th><th style={th}>현재</th><th style={th}>목표</th><th style={th}>능력치</th>{GEAR_MATS.map(([k,ko])=><th key={k} style={th}>{ko}</th>)}</tr></thead>
                <tbody>{gear.rows.map((r,i)=>(
                  <tr key={r.name}><td style={tdL}>{r.name}<Troop t={r.troop}/></td>
                    <td style={td}>{lvSel(r.from,v=>setArr(setGCur,clampG)(i,v),GEAR_MAX,L=>GEAR_LEVELS[L-1].name)}</td>
                    <td style={td}>{lvSel(r.to,v=>setArr(setGTgt,clampG)(i,v),GEAR_MAX,L=>GEAR_LEVELS[L-1].name)}</td>
                    <td style={{...td,color:C.dim}}>{gearStat(r.from)}% → <b style={{color:C.ink}}>{gearStat(r.to)}%</b></td>
                    {GEAR_MATS.map(([k])=><td key={k} style={td}>{fmt0(r[k])}</td>)}</tr>))}
                  <tr style={{fontWeight:700,color:C.brass}}><td style={tdL} colSpan={4}>합계</td>{GEAR_MATS.map(([k])=><td key={k} style={td}>{fmt0(gear.total[k])}</td>)}</tr>
                </tbody>
              </table>
            </section>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>장비 강화 기준표 <span style={sub}>(1부위, 해당 레벨로 올릴 때)</span></h2>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={th}>Lv</th><th style={{...th,textAlign:"left"}}>등급</th><th style={th}>능력치</th>{GEAR_MATS.map(([k,ko])=><th key={k} style={th}>{ko}</th>)}<th style={th}>누적 비단</th><th style={th}>누적 금사</th><th style={th}>누적 스케치</th></tr></thead>
                <tbody>{GEAR_LEVELS.map((g,i)=>{ const c=costBetween(GEAR_LEVELS,GEAR_MATS,0,i+1); return (
                  <tr key={i}><td style={td}>{i+1}</td><td style={tdL}>{g.name}</td><td style={td}>+{g.stat}%</td>
                    <td style={td}>{fmt0(g.silk)}</td><td style={td}>{fmt0(g.thread)}</td><td style={td}>{fmt0(g.sketch)}</td>
                    <td style={{...td,color:C.dim}}>{fmt0(c.silk)}</td><td style={{...td,color:C.dim}}>{fmt0(c.thread)}</td><td style={{...td,color:C.dim}}>{fmt0(c.sketch)}</td></tr>);})}</tbody>
              </table>
            </section>
            <section style={{...panel,fontSize:12,color:C.dim,lineHeight:1.7}}>
              <b style={{color:C.ink}}>참고</b> 수치는 kingshotdata.com · kingshotoptimizer.com 공개 데이터 기준(두 곳 일치). kingshotdata.kr은 신화 T2★★★ 이후 일부 값이 다르게 적혀 있어(예: T6★★★ 설계 스케치 1,660) 게임 내 수치와 대조가 필요합니다.
              부위 → 병종: 갑옷·다리 보병, 머리·장신구 기병, 지팡이·반지 궁병. 등급명은 번역이라 게임 표기와 다를 수 있습니다.
            </section>
          </div>
        </div>
      </>)}

      {tab==="charm" && (<>
        <div style={{...panel,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:16,borderColor:C.brassSoft}}>
          {CHARM_MATS.map(([k,ko])=>{ const left=short(cHave[k],charm.total[k]); return (
            <div key={k}><div style={sub}>{ko} 필요</div>
              <div style={{fontSize:24,fontWeight:800,color:C.brass,...num}}>{fmt0(charm.total[k])}</div>
              <div style={{...sub,...num,color:left<0?C.bad:C.ok}}>보유 {fmt0(cHave[k])} → {left<0?`${fmt0(-left)} 부족`:`${fmt0(left)} 남음`}</div></div>);})}
          <div><div style={sub}>판정</div>
            <div style={{fontSize:18,fontWeight:800,color:CHARM_MATS.every(([k])=>cHave[k]>=charm.total[k])?C.ok:C.bad}}>
              {CHARM_MATS.every(([k])=>cHave[k]>=charm.total[k])?"모두 충족":"부족 있음"}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(280px,340px) 1fr",gap:16,alignItems:"start"}} className="tg8grid">
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <section style={panel}>
              <h2 style={h2}>보유 재료</h2>
              <div style={{display:"grid",gap:8}}>
                {CHARM_MATS.map(([k,ko])=><label key={k} style={row}><span>{ko}</span><NumInput value={cHave[k]} onChange={v=>setCHave(h=>({...h,[k]:v}))} w={110}/></label>)}
              </div>
            </section>
            <section style={panel}>
              <h2 style={h2}>한꺼번에 설정</h2>
              <div style={{display:"grid",gap:8}}>
                <label style={row}><span>현재 레벨 전체 (18개)</span>{lvSel(cCur[0],setAll(setCCur,clampC,18),CHARM_MAX)}</label>
                <label style={row}><span>목표 레벨 전체 (18개)</span>{lvSel(cTgt[0],setAll(setCTgt,clampC,18),CHARM_MAX)}</label>
              </div>
              <div style={{...sub,marginTop:8}}>장비 6부위 × 보석 3개 = 18개. 보석은 종류와 관계없이 강화 비용이 같습니다.</div>
            </section>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>보석 강화 기준표</h2>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={th}>Lv</th><th style={th}>능력치</th><th style={th}>매뉴얼</th><th style={th}>도면</th><th style={th}>누적 매뉴얼</th><th style={th}>누적 도면</th></tr></thead>
                <tbody>{CHARM_LEVELS.map((c,i)=>{ const s=costBetween(CHARM_LEVELS,CHARM_MATS,0,i+1); return (
                  <tr key={i}><td style={td}>{i+1}</td><td style={td}>+{charmStat(i+1)}%</td><td style={td}>{fmt0(c.manual)}</td><td style={td}>{fmt0(c.plan)}</td>
                    <td style={{...td,color:C.dim}}>{fmt0(s.manual)}</td><td style={{...td,color:C.dim}}>{fmt0(s.plan)}</td></tr>);})}</tbody>
              </table>
            </section>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16,minWidth:0}}>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>보석별 현재 → 목표</h2>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>부위</th><th style={th}>보석</th><th style={th}>현재</th><th style={th}>목표</th><th style={th}>능력치</th><th style={th}>매뉴얼</th><th style={th}>도면</th></tr></thead>
                <tbody>{charm.rows.map((r,i)=>(
                  <tr key={i} style={{borderTop:r.n===1?`2px solid ${C.line}`:undefined}}>
                    <td style={tdL}>{r.n===1?<><b>{r.slot}</b><Troop t={r.troop}/></>:""}</td><td style={td}>{r.n}</td>
                    <td style={td}>{lvSel(r.from,v=>setArr(setCCur,clampC)(i,v),CHARM_MAX)}</td>
                    <td style={td}>{lvSel(r.to,v=>setArr(setCTgt,clampC)(i,v),CHARM_MAX)}</td>
                    <td style={{...td,color:C.dim}}>{charmStat(r.from)}% → <b style={{color:C.ink}}>{charmStat(r.to)}%</b></td>
                    <td style={td}>{fmt0(r.manual)}</td><td style={td}>{fmt0(r.plan)}</td></tr>))}
                  <tr style={{fontWeight:700,color:C.brass}}><td style={tdL} colSpan={5}>합계</td><td style={td}>{fmt0(charm.total.manual)}</td><td style={td}>{fmt0(charm.total.plan)}</td></tr>
                </tbody>
              </table>
            </section>
            <section style={{...panel,fontSize:12,color:C.dim,lineHeight:1.7}}>
              <b style={{color:C.ink}}>참고</b> 수치는 kingshotdata.com · kingshotdata.kr · kingshotmastery 공개 데이터 기준(세 곳 일치, 최대 22레벨). 해금: 도시센터 25레벨.
            </section>
          </div>
        </div>
      </>)}
    </>
  );
}

const row = {display:"flex",justifyContent:"space-between",alignItems:"center",gap:8};
const sub = {fontSize:11,color:C.dim};
const sel = {background:C.field,color:C.brass,border:`1px solid ${C.line}`,borderRadius:6,padding:"4px 6px",fontFamily:"inherit",fontSize:12,maxWidth:170};
