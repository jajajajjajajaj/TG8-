// 연구 시뮬레이션 엔진 — 데이터셋(ds)에 독립적. ds = ADVANCED(data.js) | BASIC(basicData.js)
import { RES } from "./data.js";

export const emptyRes = () => Object.fromEntries(RES.map(r=>[r,0]));
export const addRes = (a,b,sign=1) => { const o={...a}; RES.forEach(r=>o[r]=(o[r]||0)+sign*(b[r]||0)); return o; };

/** 다음 레벨을 올릴 수 있는지 (자원 제외): {ok, reasons[], nextLevel} */
export function unlockStatus(ds, tech, levels, tg){
  const L = (levels[tech.id]||0)+1;
  const reasons=[];
  if (L>tech.maxLevel) return {ok:false, reasons:["최대 레벨"]};
  const req = ds.requirements(tech, L);
  if (tg<req.tg) reasons.push(`전쟁아카데미 TG${req.tg} 필요`);
  for (const {id,lv} of req.prereqs){
    const have = levels[id]||0;
    if (have<lv) reasons.push(`${ds.TECH_BY_ID[id].ko} Lv.${lv} 필요 (현재 ${have})`);
  }
  return {ok:reasons.length===0, reasons, nextLevel:L};
}

export const canAfford = (cost, have) => RES.every(r=> (have[r]||0) >= (cost[r]||0) - 1e-6);
export const shortOf = (cost, have) => RES.filter(r=> (have[r]||0) < (cost[r]||0) - 1e-6);

/**
 * 보유 자원으로 어디까지 올릴 수 있는지 시뮬레이션
 * strategy: "order" (트리 순서대로 한 연구씩 끝내기) | "even" (낮은 레벨부터 고르게)
 * allowed: 허용 tech id Set (null이면 전체)
 */
export function simulate(ds, { levels, have, tg, strategy="even", allowed=null, speed=0 }){
  const lv = {...levels}; let res = {...have};
  const steps=[]; let minutes=0;
  const spent = emptyRes();
  const accel = 1 + speed/100;
  let blockers=[];
  for (let iter=0; iter<2000; iter++){
    const cands=[];
    blockers=[];
    for (const t of ds.TECHS){
      if (allowed && !allowed.has(t.id)) continue;
      const u = unlockStatus(ds, t, lv, tg);
      if (!u.ok) continue;
      const cost = ds.levelCost(t, u.nextLevel);
      if (canAfford(cost, res)) cands.push({t, L:u.nextLevel, cost});
      else blockers.push({t, L:u.nextLevel, cost, short: shortOf(cost,res)});
    }
    if (!cands.length) break;
    let pick = cands[0];
    if (strategy==="even"){
      for (const c of cands) if (c.L < pick.L) pick = c;
    }
    res = addRes(res, pick.cost, -1);
    RES.forEach(r=> spent[r]+=pick.cost[r]||0);
    lv[pick.t.id]=pick.L; minutes += pick.cost.minutes/accel;
    steps.push({ id:pick.t.id, ko:pick.t.ko, L:pick.L, cost:pick.cost, minutes:pick.cost.minutes/accel });
  }
  return { levels:lv, remaining:res, spent, steps, minutes, blockers };
}

/**
 * 목표 연구·레벨까지 필요한 모든 (선행 포함) 업그레이드와 총비용
 */
export function planGoal(ds, { levels, targetId, targetLevel, speed=0 }){
  const need = {}; // id -> level required
  let tgReq = 0;
  const visit = (id, L) => {
    if ((need[id]||0)>=L) return;
    need[id]=L;
    const t=ds.TECH_BY_ID[id];
    for (let k=(levels[id]||0)+1; k<=L; k++){
      const req = ds.requirements(t,k);
      tgReq = Math.max(tgReq, req.tg);
      for (const p of req.prereqs) visit(p.id, p.lv);
    }
  };
  visit(targetId, targetLevel);
  const items=[]; const total=emptyRes(); let minutes=0;
  const accel=1+speed/100;
  for (const t of ds.TECHS){
    const to=need[t.id]; if(!to) continue;
    const from=levels[t.id]||0; if (to<=from) continue;
    const sub=emptyRes(); let m=0;
    for (let k=from+1;k<=to;k++){ const c=ds.levelCost(t,k); RES.forEach(r=>sub[r]+=c[r]); m+=c.minutes; }
    RES.forEach(r=>total[r]+=sub[r]); minutes+=m/accel;
    items.push({ id:t.id, ko:t.ko, from, to, cost:sub, minutes:m/accel });
  }
  return { items, total, minutes, tgReq: Math.max(tgReq, ds.tgOptions[0]) };
}

/** 그룹 필터 → 허용 tech Set (공용 그룹은 항상 포함) */
export function allowedSet(ds, group){
  if (!group || group==="전체") return null;
  return new Set(ds.TECHS.filter(t=> t.group===group || ds.sharedGroups.includes(t.group)).map(t=>t.id));
}
