import { useEffect, useMemo, useState } from "react";
import { C, num, panel, h2, th, td, tdL, btn, fmt, fmt0, NumInput } from "./ui.jsx";

// ── 순금 도가니 제련 규칙 (킹샷 시트 '정련순금' A1:F17 기준)
//  · 한 주(7일) 안에서 제련 횟수가 쌓일수록 순금 가격 구간이 올라감 (20회 단위), 주 최대 100회
//  · 하루 첫 1회는 순금 50% 할인 (할인 교환도 횟수에 포함)
//  · 최적 일정: 1일차에 몰아서 하고 2~7일차는 하루 1회 → 할인이 가장 비싼 구간에 적용됨
export const TIERS = [
  { name:"1구간", price:20,  ev:1.45,  prob:{1:0.65,2:0.25,3:0.10} },
  { name:"2구간", price:50,  ev:2.15,  prob:{2:0.85,3:0.15} },
  { name:"3구간", price:100, ev:3.18,  prob:{3:0.85,4:0.125,5:0.02,6:0.005} },
  { name:"4구간", price:130, ev:3.435, prob:{3:0.75,4:0.15,5:0.05,6:0.03,7:0.01,8:0.005,9:0.005} },
  { name:"5구간", price:160, ev:3.71,  prob:{3:0.7,4:0.12,5:0.09,6:0.04,7:0.015,8:0.01,9:0.01,10:0.005,11:0.005,12:0.005} },
];
const PER_TIER = 20, MAX_WEEK = 100, DAYS = 7;
const tierOf = i => Math.min(Math.floor((i-1)/PER_TIER), TIERS.length-1);   // i: 주 내 회차(1-based)

/** 한 주에 k회 제련할 때 (최적 일정 기준) 순금 소모·기대 획득 */
export function weekPlan(k){
  if (k<=0) return { k:0, cost:0, gain:0, day1:0, daily:0, tiers:[] };
  let full=0, gain=0; const cnt=Array(TIERS.length).fill(0);
  for (let i=1;i<=k;i++){ const t=tierOf(i); full+=TIERS[t].price; gain+=TIERS[t].ev; cnt[t]++; }
  // 할인 대상: 1회차(1일차 첫 교환) + 마지막 6회(2~7일차 각 첫 교환). k<=7이면 전부 할인
  const disc = new Set([1]); for (let i=Math.max(2,k-5); i<=k; i++) disc.add(i);
  let off=0; disc.forEach(i=>{ off += TIERS[tierOf(i)].price*0.5; });
  const day1 = k>=DAYS ? k-(DAYS-1) : 1;
  const daily = k>=DAYS ? DAYS-1 : k-1;
  return { k, cost: full-off, gain, day1, daily, tiers: cnt };
}
const PLANS = Array.from({length:MAX_WEEK+1},(_,k)=>weekPlan(k));

/** 목표 획득량을 W주 안에 최소 순금으로 채우는 주당 횟수 배분 */
export function optimize(target, weeks){
  if (weeks<=0) return null;
  if (target<=0) return { counts:Array(weeks).fill(0), cost:0, gain:0 };
  let best=null;
  for (let q=0;q<=MAX_WEEK;q++) for (let m=0;m<=weeks;m++){
    if (q===MAX_WEEK && m>0) continue;
    const hi = q+1;
    const gain = PLANS[q].gain*(weeks-m) + PLANS[hi>MAX_WEEK?q:hi].gain*m;
    if (gain < target-1e-9) continue;
    const cost = PLANS[q].cost*(weeks-m) + PLANS[hi>MAX_WEEK?q:hi].cost*m;
    const n = q*weeks+m;
    if (!best || cost<best.cost-1e-9 || (Math.abs(cost-best.cost)<1e-9 && n<best.n)) best={q,m,cost,gain,n};
  }
  if (!best) return null;
  const counts = Array.from({length:weeks},(_,i)=> i<best.m ? best.q+1 : best.q);
  return { counts, cost:best.cost, gain:best.gain };
}

const STORE_KEY = "tg8_refine_v1";
function load(){ try{ const s=JSON.parse(localStorage.getItem(STORE_KEY)); if(s) return s; }catch{} return null; }

export default function Refine(){
  const saved = useMemo(load,[]);
  const [target,setTarget] = useState(saved?.target ?? 650);
  const [weeks,setWeeks] = useState(saved?.weeks ?? 8);
  const [haveRefined,setHaveRefined] = useState(saved?.haveRefined ?? 0);
  const [haveGold,setHaveGold] = useState(saved?.haveGold ?? 0);
  const [weeklyGold,setWeeklyGold] = useState(saved?.weeklyGold ?? 0);
  useEffect(()=>{ try{ localStorage.setItem(STORE_KEY, JSON.stringify({target,weeks,haveRefined,haveGold,weeklyGold})); }catch{} },[target,weeks,haveRefined,haveGold,weeklyGold]);

  const need = Math.max(0, target-haveRefined);
  const W = Math.max(0, Math.floor(weeks));
  const maxGain = PLANS[MAX_WEEK].gain*W;
  const res = useMemo(()=>optimize(need, W),[need,W]);

  const rows = useMemo(()=>{
    if(!res) return [];
    let cumG=haveRefined, cumC=0;
    return res.counts.map((k,i)=>{ const p=PLANS[k]; cumG+=p.gain; cumC+=p.cost;
      return { week:i+1, ...p, cumG, cumC, goldLeft: haveGold + weeklyGold*(i+1) - cumC }; });
  },[res,haveRefined,haveGold,weeklyGold]);
  const goldGiven = haveGold>0 || weeklyGold>0;
  const goldOK = res && (haveGold + weeklyGold*W) >= res.cost - 1e-9;
  const minWeeks = need>0 ? Math.ceil(need/PLANS[MAX_WEEK].gain) : 0;

  const schedule = p => p.k===0 ? "제련 없음" : p.k<DAYS ? `하루 1회씩 ${p.k}일 (모두 할인)` : `1일차 ${p.day1}회 (첫 1회 할인) → 2~7일차 하루 1회 (할인)`;
  const tierText = p => p.tiers.map((n,t)=> n?`${TIERS[t].name} ${n}회`:null).filter(Boolean).join(" · ");

  return (
    <>
      <div style={{...panel,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:16,borderColor:C.brassSoft}}>
        <div><div style={sub}>총 순금 소모 (최소)</div>
          <div style={{fontSize:26,fontWeight:800,color:C.brass,...num}}>{res?fmt0(res.cost):"—"}</div>
          <div style={{...sub,...num}}>{res?`주 평균 ${fmt0(res.cost/Math.max(1,W))}`:""}</div></div>
        <div><div style={sub}>기대 획득 정련순금</div>
          <div style={{fontSize:20,fontWeight:700,...num}}>{res?fmt(res.gain,1):"—"} <span style={sub}>/ 필요 {fmt0(need)}</span></div></div>
        <div><div style={sub}>총 제련 횟수</div>
          <div style={{fontSize:20,fontWeight:700,...num}}>{res?fmt0(res.counts.reduce((a,b)=>a+b,0)):"—"}회</div></div>
        <div><div style={sub}>남는 순금 (기간 종료 시)</div>
          <div style={{fontSize:20,fontWeight:700,color:!res||!goldGiven?C.dim:goldOK?C.ok:C.bad,...num}}>
            {!res||!goldGiven ? "—" : fmt0(haveGold + weeklyGold*W - res.cost)}</div>
          <div style={{...sub,...num}}>{goldGiven&&res ? `보유 ${fmt0(haveGold)} + 수입 ${fmt0(weeklyGold*W)} − 소모 ${fmt0(res.cost)}` : "보유 순금·수입을 넣으면 계산"}</div></div>
        <div><div style={sub}>판정</div>
          <div style={{fontSize:18,fontWeight:800,color:!res?C.bad:!goldGiven?C.dim:goldOK?C.ok:C.warn}}>
            {!res ? `기간 부족 (최소 ${minWeeks}주 필요)` : !goldGiven ? "순금 입력 시 판정" : goldOK ? "순금 충분 · 달성 가능" : `순금 ${fmt0(res.cost-haveGold-weeklyGold*W)} 부족`}</div></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"minmax(280px,340px) 1fr",gap:16,alignItems:"start"}} className="tg8grid">
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <section style={panel}>
            <h2 style={h2}>목표</h2>
            <div style={{display:"grid",gap:10}}>
              <label style={row}><span>목표 정련순금<div style={sub}>TG 업그레이드 탭의 필요량</div></span><NumInput value={target} onChange={setTarget} w={100} suffix="개"/></label>
              <label style={row}><span>기간<div style={sub}>주 단위 (주 최대 100회)</div></span><NumInput value={weeks} onChange={setWeeks} w={100} suffix="주"/></label>
              <label style={row}><span>보유 정련순금</span><NumInput value={haveRefined} onChange={setHaveRefined} w={100} suffix="개"/></label>
            </div>
          </section>
          <section style={panel}>
            <h2 style={h2}>순금 (선택)</h2>
            <div style={{display:"grid",gap:10}}>
              <label style={row}><span>보유 순금</span><NumInput value={haveGold} onChange={setHaveGold} w={100} suffix="개"/></label>
              <label style={row}><span>주당 순금 수입<div style={sub}>임무·이벤트 등 예상치</div></span><NumInput value={weeklyGold} onChange={setWeeklyGold} w={100} suffix="개"/></label>
            </div>
            <div style={{...sub,marginTop:8}}>둘 다 0이면 판정 없이 소모량만 계산합니다.</div>
          </section>
          <section style={{...panel,overflowX:"auto"}}>
            <h2 style={h2}>제련 확률표</h2>
            <table style={{borderCollapse:"collapse",width:"100%"}}>
              <thead><tr><th style={{...th,textAlign:"left"}}>획득</th>{TIERS.map(t=><th key={t.name} style={th}>{t.name}</th>)}</tr></thead>
              <tbody>
                <tr style={{color:C.dim}}><td style={tdL}>순금 소모</td>{TIERS.map(t=><td key={t.name} style={td}>{t.price}</td>)}</tr>
                {Array.from({length:12},(_,i)=>i+1).map(n=>(
                  <tr key={n}><td style={tdL}>{n}개</td>{TIERS.map(t=><td key={t.name} style={{...td,color:t.prob[n]?C.ink:C.lineSoft}}>{t.prob[n]?`${+(t.prob[n]*100).toFixed(1)}%`:"·"}</td>)}</tr>
                ))}
                <tr style={{fontWeight:700,color:C.brass}}><td style={tdL}>1회 기댓값</td>{TIERS.map(t=><td key={t.name} style={td}>{t.ev}</td>)}</tr>
              </tbody>
            </table>
            <div style={{...sub,marginTop:8}}>주 내 1~20회째 1구간, 21~40회째 2구간 … 81~100회째 5구간. 하루 첫 1회는 50% 할인.</div>
          </section>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16,minWidth:0}}>
          <section style={{...panel,overflowX:"auto"}}>
            <h2 style={h2}>주차별 계획 {res && <span style={sub}>— 순금이 가장 적게 드는 배분</span>}</h2>
            {!res ? <div style={{color:C.bad,fontSize:13}}>{W<=0?"기간을 1주 이상 넣어주세요.":`주 최대 100회(기대 ${fmt(PLANS[MAX_WEEK].gain,1)}개)로도 ${W}주 안에 ${fmt0(need)}개를 채울 수 없습니다. 최소 ${minWeeks}주가 필요합니다.`}</div>
            : need===0 ? <div style={{color:C.ok,fontSize:13}}>이미 목표를 보유하고 있습니다.</div> :
            <table style={{borderCollapse:"collapse",width:"100%"}}>
              <thead><tr><th style={th}>주차</th><th style={th}>횟수</th><th style={{...th,textAlign:"left"}}>일정</th><th style={{...th,textAlign:"left"}}>구간</th><th style={th}>순금 소모</th><th style={th}>기대 획득</th><th style={th}>누적 정련순금</th><th style={th}>누적 순금</th>{goldGiven&&<th style={th}>순금 잔여</th>}</tr></thead>
              <tbody>{rows.map(r=>(
                <tr key={r.week} style={{opacity:r.k?1:0.5}}><td style={td}>{r.week}</td><td style={{...td,fontWeight:700}}>{r.k}</td>
                  <td style={{...tdL,whiteSpace:"normal",fontSize:12}}>{schedule(r)}</td>
                  <td style={{...tdL,whiteSpace:"normal",fontSize:12,color:C.dim}}>{tierText(r)}</td>
                  <td style={td}>{fmt0(r.cost)}</td><td style={td}>{fmt(r.gain,1)}</td>
                  <td style={{...td,color:r.cumG>=target-1e-9?C.ok:C.ink}}>{fmt(r.cumG,1)}</td><td style={td}>{fmt0(r.cumC)}</td>
                  {goldGiven&&<td style={{...td,color:r.goldLeft<0?C.bad:C.ok}}>{fmt0(r.goldLeft)}</td>}</tr>
              ))}
              <tr style={{fontWeight:700,color:C.brass}}><td style={td}>합계</td><td style={td}>{fmt0(res.counts.reduce((a,b)=>a+b,0))}</td><td style={tdL} colSpan={2}></td>
                <td style={td}>{fmt0(res.cost)}</td><td style={td}>{fmt(res.gain,1)}</td><td style={td}>{fmt(haveRefined+res.gain,1)}</td><td style={td}>{fmt0(res.cost)}</td>{goldGiven&&<td style={td}></td>}</tr>
              </tbody>
            </table>}
          </section>

          <section style={{...panel,overflowX:"auto"}}>
            <h2 style={h2}>주당 횟수별 순금 소모 (참고)</h2>
            <table style={{borderCollapse:"collapse",width:"100%"}}>
              <thead><tr><th style={th}>주 횟수</th><th style={th}>순금 소모</th><th style={th}>기대 획득</th><th style={th}>1개당 순금</th><th style={{...th,textAlign:"left"}}>일정</th></tr></thead>
              <tbody>{[7,14,20,26,33,40,46,60,66,80,86,100].map(k=>{const p=PLANS[k]; return (
                <tr key={k}><td style={td}>{k}</td><td style={td}>{fmt0(p.cost)}</td><td style={td}>{fmt(p.gain,1)}</td><td style={td}>{fmt(p.cost/p.gain,1)}</td><td style={{...tdL,fontSize:12,color:C.dim}}>{schedule(p)}</td></tr>);})}</tbody>
            </table>
          </section>

          <section style={{...panel,fontSize:12,color:C.dim,lineHeight:1.7}}>
            <b style={{color:C.ink}}>계산 방식</b> 회차가 늘수록 순금 1개당 비용이 계속 오르므로(1~7회 6.9 → 8~20회 13.8 → … → 81~100회 43.1), 목표를 채우는 조합 중 순금이 가장 적게 드는 배분은 주차별 횟수를 최대한 고르게 나누는 것입니다.
            획득량은 확률 기댓값이라 실제 결과는 앞뒤로 흔들릴 수 있으니 여유를 두고 잡으세요. 할인은 하루 첫 교환에만 적용되므로 1일차에 몰아서 하고 나머지 6일은 하루 1회씩 하는 일정이 가장 유리합니다.
          </section>
        </div>
      </div>
    </>
  );
}

const row = {display:"flex",justifyContent:"space-between",alignItems:"center",gap:8};
const sub = {fontSize:11,color:C.dim};
