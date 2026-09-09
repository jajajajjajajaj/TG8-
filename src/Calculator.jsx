import { useMemo, useState } from "react";
import { C, num, panel, h2, th, td, tdL, btn, fmt, fmt0, dhm, NumInput } from "./ui.jsx";

const STAGES = ["TG5→TG6","TG6→TG7","TG7→TG8"];
const RES4 = ["식량","목재","석재","철광"];
const RES6 = [...RES4,"순금","정련순금"];
const MAX_REDUCE_H = 8;
const UPGRADES_PER_STAGE = 5;

// 기본 체크 상태 (기준표 시트와 동일)
const DEFAULT_CHECK = new Set([
  "도시센터|TG6→TG7","도시센터|TG7→TG8","대사관|TG6→TG7",
  "보병대|TG5→TG6","보병대|TG6→TG7","보병대|TG7→TG8",
  "기병대|TG5→TG6","기병대|TG6→TG7","기병대|TG7→TG8",
  "궁병대|TG5→TG6","궁병대|TG6→TG7","궁병대|TG7→TG8",
]);

export default function Calculator({ costs, boxes: boxDefs, source }) {
  const [discount,setDiscount] = useState(15);
  const [speed,setSpeed] = useState(111.8);
  const [reduceH,setReduceH] = useState(8);
  const [have,setHave] = useState({식량:0,목재:0,석재:0,철광:0,순금:0,정련순금:0});
  const [boxes,setBoxes] = useState({1:0,2:0,3:0});
  const [prio,setPrio] = useState({식량:4,목재:3,석재:2,철광:1});
  const [checked,setChecked] = useState(DEFAULT_CHECK);

  const BUILDINGS = useMemo(()=>[...new Set(costs.map(r=>r.building))],[costs]);
  const BOX = useMemo(()=>Object.fromEntries(boxDefs.map(b=>[b.resource,[b.lv1,b.lv2,b.lv3]])),[boxDefs]);

  const toggle = key => setChecked(s=>{const n=new Set(s); n.has(key)?n.delete(key):n.add(key); return n;});
  const toggleBuilding = b => setChecked(s=>{
    const keys = STAGES.map(st=>`${b}|${st}`); const all = keys.every(k=>s.has(k));
    const n=new Set(s); keys.forEach(k=> all?n.delete(k):n.add(k)); return n;
  });

  const calc = useMemo(()=>{
    const disc = 1 - discount/100;
    const accel = 1 + speed/100;
    const reduceMin = Math.min(Math.max(reduceH,0),MAX_REDUCE_H)*60;

    const rows = costs.map(r=>{
      const key=`${r.building}|${r.stage}`, on=checked.has(key);
      const perAccel = r.minutes_per_upgrade/accel;
      const perReduced = Math.max(0, perAccel-reduceMin);
      const cut = (perAccel-perReduced)*UPGRADES_PER_STAGE;
      return { key,b:r.building,st:r.stage,on,
        순금:on?r.gold:0, 정련순금:on?r.refined_gold:0,
        식량:on?r.food*disc:0, 목재:on?r.wood*disc:0, 석재:on?r.stone*disc:0, 철광:on?r.iron*disc:0,
        perAccel, perReduced, stageMin:on?perReduced*UPGRADES_PER_STAGE:0, stageCut:on?cut:0 };
    });
    const total = {};
    [...RES6,"stageMin","stageCut"].forEach(k=> total[k]=rows.reduce((a,r)=>a+r[k],0));

    const byBuilding = BUILDINGS.map(b=>{
      const rs=rows.filter(r=>r.b===b); const o={b};
      [...RES6,"stageMin"].forEach(k=>o[k]=rs.reduce((a,r)=>a+r[k],0)); return o;
    });

    const first = RES6.map(r=>({r,have:have[r],need:total[r],left:have[r]-total[r]}));

    const prioVals = RES4.map(r=>prio[r]);
    const prioOk = [1,2,3,4].every(p=>prioVals.filter(v=>v===p).length===1);
    let r3=boxes[3], r2=boxes[2], r1=boxes[1];
    const alloc = {};
    const order = prioOk ? [...RES4].sort((a,b)=>prio[a]-prio[b]) : RES4;
    order.forEach(r=>{
      const need=total[r], short=Math.max(0,need-have[r]);
      const [v1,v2,v3]=BOX[r] || [0.01,0.1,1];
      const u3=Math.min(r3, Math.ceil(short/v3)); const rem1=short-u3*v3; r3-=u3;
      const u2=rem1>0?Math.min(r2, Math.ceil(rem1/v2)):0; const rem2=rem1-u2*v2; r2-=u2;
      const u1=rem2>0?Math.min(r1, Math.ceil(rem2/v1)):0; r1-=u1;
      const boxM=u3*v3+u2*v2+u1*v1;
      alloc[r]={short,u3,u2,u1,boxM,final:have[r]+boxM-need};
    });
    return { rows,total,byBuilding,first,alloc,prioOk,left:{3:r3,2:r2,1:r1},reduceMin };
  },[costs,BUILDINGS,BOX,discount,speed,reduceH,have,boxes,prio,checked]);

  const goldOK = calc.first[4].left>=0 && calc.first[5].left>=0;
  const allOK = goldOK && RES4.every(r=>calc.alloc[r].final>=0);
  const boxLabel = l => { const v=r=>(BOX[r]||[0,0,0])[l-1]; const k=x=> x>=1?`${x}M`:`${Math.round(x*1000)}k`;
    return `빵${k(v("식량"))}·목재${k(v("목재"))}·석재${k(v("석재"))}·철${k(v("철광"))}`; };

  return (
    <>
      <div style={{...panel,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:16,borderColor:C.brass+"66"}}>
        <div>
          <div style={{fontSize:12,color:C.dim}}>총 건설시간 (체크한 구간)</div>
          <div style={{fontSize:26,fontWeight:800,color:C.brass,...num}}>{dhm(calc.total.stageMin)}</div>
          <div style={{fontSize:12,color:C.dim,...num}}>{fmt0(calc.total.stageMin)}분</div>
        </div>
        <div>
          <div style={{fontSize:12,color:C.dim}}>감소로 줄인 시간</div>
          <div style={{fontSize:20,fontWeight:700,...num}}>{dhm(calc.total.stageCut)}</div>
        </div>
        <div>
          <div style={{fontSize:12,color:C.dim}}>순금 / 정련순금 필요</div>
          <div style={{fontSize:20,fontWeight:700,...num}}>{fmt0(calc.total.순금)} / {fmt0(calc.total.정련순금)}</div>
        </div>
        <div>
          <div style={{fontSize:12,color:C.dim}}>최종 판정</div>
          <div style={{fontSize:20,fontWeight:800,color:allOK?C.ok:C.bad}}>{allOK?"모두 충족":"부족 있음"}</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"minmax(280px,340px) 1fr",gap:16,alignItems:"start"}} className="tg8grid">
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <section style={panel}>
            <h2 style={h2}>입력값</h2>
            <div style={{display:"grid",gap:10}}>
              <label style={row}><span>살로 할인율<div style={sub}>건설 비용만 감소</div></span>
                <NumInput value={discount} onChange={setDiscount} step={0.1} w={80} suffix="%"/></label>
              <label style={row}><span>건설 가속<div style={sub}>모든 건설속도 보너스 합</div></span>
                <NumInput value={speed} onChange={setSpeed} step={0.1} w={80} suffix="%"/></label>
              <label style={row}><span>1건당 감소<div style={sub}>최대 8시간, 구간당 5회 적용</div></span>
                <NumInput value={reduceH} onChange={setReduceH} step={0.5} w={80} suffix="시간"/></label>
              <div style={{fontSize:12,color:C.dim,...num}}>
                = 1건당 {fmt0(calc.reduceMin)}분 · 구간당 {fmt0(calc.reduceMin*5)}분 ({fmt(calc.reduceMin*5/60,1)}시간)
                {reduceH>MAX_REDUCE_H && <span style={{color:C.warn}}> · 8시간으로 잘렸습니다</span>}
              </div>
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2}>보유 자원 (M)</h2>
            <div style={{...sub,marginBottom:8}}>상자로 받을 몫은 넣지 마세요. 아래에서 따로 더합니다.</div>
            <div style={{display:"grid",gap:8}}>
              {RES6.map(r=>(
                <label key={r} style={row}><span>{r}</span>
                  <NumInput value={have[r]} onChange={v=>setHave(h=>({...h,[r]:v}))} step={r==="순금"||r==="정련순금"?1:0.1} w={120}/></label>
              ))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2}>자원 선택 상자</h2>
            <div style={{display:"grid",gap:8,marginBottom:12}}>
              {[3,2,1].map(l=>(
                <label key={l} style={row}><span>{l}렙 상자<div style={sub}>{boxLabel(l)}</div></span>
                  <NumInput value={boxes[l]} onChange={v=>setBoxes(b=>({...b,[l]:v}))} w={90} suffix="개"/></label>
              ))}
            </div>
            <div style={{fontSize:13,marginBottom:6}}>우선순위 <span style={sub}>(1이 먼저, 1~4 중복 없이)</span></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {RES4.map(r=>(
                <label key={r} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,fontSize:12}}>{r}
                  <select value={prio[r]} onChange={e=>setPrio(p=>({...p,[r]:+e.target.value}))}
                    style={{background:C.field,color:C.brass,border:`1px solid ${C.line}`,borderRadius:6,padding:"4px 6px",fontFamily:"inherit"}}>
                    {[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {!calc.prioOk && <div style={{color:C.warn,fontSize:12,marginTop:8}}>우선순위가 겹칩니다. 1~4를 한 번씩만 쓰세요. (지금은 식량→철광 순으로 배분)</div>}
          </section>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16,minWidth:0}}>
          <section style={{...panel,overflowX:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",flexWrap:"wrap",gap:8}}>
              <h2 style={h2}>구간별 소요량 — 체크한 줄만 합산</h2>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>setChecked(new Set(costs.map(r=>`${r.building}|${r.stage}`)))} style={btn}>전체 선택</button>
                <button onClick={()=>setChecked(new Set())} style={btn}>전체 해제</button>
                <button onClick={()=>setChecked(new Set(DEFAULT_CHECK))} style={btn}>기본값</button>
              </div>
            </div>
            <table style={{borderCollapse:"collapse",width:"100%"}}>
              <thead><tr>
                <th style={{...th,textAlign:"left"}}>건물</th><th style={{...th,textAlign:"left"}}>구간</th><th style={th}>체크</th>
                <th style={th}>순금</th><th style={th}>정련순금</th><th style={th}>식량</th><th style={th}>목재</th><th style={th}>석재</th><th style={th}>철광</th>
                <th style={th}>1건 가속후</th><th style={th}>1건 감소후</th><th style={th}>구간 시간</th><th style={th}>구간 감소</th>
              </tr></thead>
              <tbody>
                {BUILDINGS.map(b=> calc.rows.filter(r=>r.b===b).map((r,i)=>(
                  <tr key={r.key} style={{opacity:r.on?1:0.5,background:r.on?C.brass+"12":"transparent"}}>
                    <td style={tdL}>{i===0 && <button onClick={()=>toggleBuilding(b)} style={{...btn,padding:"2px 6px",fontWeight:700}}>{b}</button>}</td>
                    <td style={tdL}>{r.st}</td>
                    <td style={td}><input type="checkbox" checked={r.on} onChange={()=>toggle(r.key)} style={{accentColor:C.brass,width:16,height:16}}/></td>
                    <td style={td}>{fmt0(r.순금)}</td><td style={td}>{fmt0(r.정련순금)}</td>
                    <td style={td}>{fmt(r.식량)}</td><td style={td}>{fmt(r.목재)}</td><td style={td}>{fmt(r.석재)}</td><td style={td}>{fmt(r.철광)}</td>
                    <td style={{...td,color:C.dim}}>{fmt0(r.perAccel)}</td><td style={{...td,color:C.dim}}>{fmt0(r.perReduced)}</td>
                    <td style={td}>{fmt0(r.stageMin)}</td><td style={td}>{fmt0(r.stageCut)}</td>
                  </tr>
                )))}
                <tr style={{fontWeight:700,color:C.brass}}>
                  <td style={tdL} colSpan={3}>합계</td>
                  <td style={td}>{fmt0(calc.total.순금)}</td><td style={td}>{fmt0(calc.total.정련순금)}</td>
                  <td style={td}>{fmt(calc.total.식량)}</td><td style={td}>{fmt(calc.total.목재)}</td><td style={td}>{fmt(calc.total.석재)}</td><td style={td}>{fmt(calc.total.철광)}</td>
                  <td style={td}></td><td style={td}></td><td style={td}>{fmt0(calc.total.stageMin)}</td><td style={td}>{fmt0(calc.total.stageCut)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16}}>
            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>1차 판정 (상자 사용 전)</h2>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>자원</th><th style={th}>보유</th><th style={th}>필요</th><th style={th}>잔여</th><th style={th}>판정</th></tr></thead>
                <tbody>{calc.first.map(({r,have:h,need,left})=>{
                  const d = r==="순금"||r==="정련순금"?0:2;
                  return <tr key={r}><td style={tdL}>{r}</td><td style={td}>{fmt(h,d)}</td><td style={td}>{fmt(need,d)}</td>
                    <td style={{...td,color:left<0?C.bad:C.ok}}>{fmt(left,d)}</td>
                    <td style={{...td,color:left<0?C.bad:C.ok,fontWeight:700}}>{left<0?"부족":"가능"}</td></tr>;
                })}</tbody>
              </table>
            </section>

            <section style={{...panel,overflowX:"auto"}}>
              <h2 style={h2}>상자 자동 배분 (3렙→2렙→1렙)</h2>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr><th style={{...th,textAlign:"left"}}>자원</th><th style={th}>순위</th><th style={th}>부족분</th><th style={th}>3렙</th><th style={th}>2렙</th><th style={th}>1렙</th><th style={th}>상자 환산</th><th style={th}>최종 잔여</th><th style={th}>판정</th></tr></thead>
                <tbody>
                  {RES4.map(r=>{const a=calc.alloc[r]; return (
                    <tr key={r}><td style={tdL}>{r}</td><td style={td}>{prio[r]}</td><td style={td}>{fmt(a.short,2)}</td>
                      <td style={td}>{fmt0(a.u3)}</td><td style={td}>{fmt0(a.u2)}</td><td style={td}>{fmt0(a.u1)}</td>
                      <td style={td}>{fmt(a.boxM,2)}</td>
                      <td style={{...td,color:a.final<0?C.bad:C.ok}}>{fmt(a.final,2)}</td>
                      <td style={{...td,color:a.final<0?C.bad:C.ok,fontWeight:700}}>{a.final<0?"부족":"가능"}</td></tr>);})}
                  <tr style={{color:C.dim}}><td style={tdL} colSpan={3}>남은 상자</td>
                    <td style={td}>{fmt0(calc.left[3])}</td><td style={td}>{fmt0(calc.left[2])}</td><td style={td}>{fmt0(calc.left[1])}</td><td style={td} colSpan={3}></td></tr>
                </tbody>
              </table>
              <div style={{fontSize:11,color:C.dim,marginTop:8,lineHeight:1.6}}>
                상자로는 순금·정련순금을 얻을 수 없습니다. 상자는 쪼갤 수 없어 올림으로 배분하므로 최종 잔여가 0보다 조금 크게 나올 수 있습니다.
              </div>
            </section>
          </div>

          <section style={{...panel,overflowX:"auto"}}>
            <h2 style={h2}>건물별 합계 (체크한 구간만)</h2>
            <table style={{borderCollapse:"collapse",width:"100%"}}>
              <thead><tr><th style={{...th,textAlign:"left"}}>건물</th><th style={th}>순금</th><th style={th}>정련순금</th><th style={th}>식량</th><th style={th}>목재</th><th style={th}>석재</th><th style={th}>철광</th><th style={th}>건설시간(분)</th><th style={th}>환산</th></tr></thead>
              <tbody>{calc.byBuilding.filter(o=>o.stageMin>0||o.순금>0).map(o=>(
                <tr key={o.b}><td style={tdL}>{o.b}</td><td style={td}>{fmt0(o.순금)}</td><td style={td}>{fmt0(o.정련순금)}</td>
                  <td style={td}>{fmt(o.식량)}</td><td style={td}>{fmt(o.목재)}</td><td style={td}>{fmt(o.석재)}</td><td style={td}>{fmt(o.철광)}</td>
                  <td style={td}>{fmt0(o.stageMin)}</td><td style={{...td,color:C.dim}}>{dhm(o.stageMin)}</td></tr>
              ))}</tbody>
            </table>
            {calc.byBuilding.every(o=>o.stageMin===0) && <div style={{color:C.dim,fontSize:13}}>체크한 구간이 없습니다. 위 표에서 구간을 선택하세요.</div>}
          </section>

          <section style={{...panel,fontSize:12,color:C.dim,lineHeight:1.7}}>
            <b style={{color:C.ink}}>계산 순서</b> ① 원본 1건 시간 ÷ (1 + 건설가속) → ② 1건당 감소 시간(최대 8시간)을 뺌 → ③ ×5 로 구간 합계.
            한 구간(예: TG6→TG7)은 TG6-1~TG6-4와 TG7, 총 5번의 업그레이드입니다. 살로 할인은 식량·목재·석재·철광 비용에만 적용됩니다.
            <div style={{marginTop:6}}>기준 수치 출처: {source}</div>
          </section>
        </div>
      </div>
    </>
  );
}

const row = {display:"flex",justifyContent:"space-between",alignItems:"center",gap:8};
const sub = {fontSize:11,color:C.dim};
