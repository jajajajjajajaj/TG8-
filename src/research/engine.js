import { TECHS, TECH_BY_ID, RES, levelCost, prereqLevel } from "./data.js";

export const emptyRes = () => Object.fromEntries(RES.map(r=>[r,0]));
export const addRes = (a,b,sign=1) => { const o={...a}; RES.forEach(r=>o[r]=(o[r]||0)+sign*(b[r]||0)); return o; };

/** 다음 레벨을 올릴 수 있는지 (자원 제외): {ok, reasons[]} */
export function unlockStatus(tech, levels, tg){
  const L = (levels[tech.id]||0)+1;
  const reasons=[];
  if (L>tech.maxLevel) return {ok:false, reasons:["최대 레벨"]};
  if (tg<tech.tg) reasons.push(`전쟁아카데미 TG${tech.tg} 필요`);
  for (const p of tech.prereqs){
    const need = prereqLevel(tech,L,p), have = levels[p]||0;
    if (have<need) reasons.push(`${TECH_BY_ID[p].ko} Lv.${need} 필요 (현재 ${have})`);
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
export function simulate({ levels, have, tg, strategy="even", allowed=null, speed=0 }){
  const lv = {...levels}; let res = {...have};
  const steps=[]; let minutes=0;
  const spent = emptyRes();
  const accel = 1 + speed/100;
  let blockers=[];
  for (let iter=0; iter<2000; iter++){
    const cands=[];
    blockers=[];
    for (const t of TECHS){
      if (allowed && !allowed.has(t.id)) continue;
      const u = unlockStatus(t, lv, tg);
      if (!u.ok) continue;
      const cost = levelCost(t, u.nextLevel);
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
export function planGoal({ levels, targetId, targetLevel, speed=0 }){
  const need = {}; // id -> level required
  const visit = (id, L) => {
    if ((need[id]||0)>=L) return;
    need[id]=L;
    const t=TECH_BY_ID[id];
    for (let k=(levels[id]||0)+1; k<=L; k++)
      for (const p of t.prereqs) visit(p, prereqLevel(t,k,p));
  };
  visit(targetId, targetLevel);
  const items=[]; const total=emptyRes(); let minutes=0; let tgReq=5;
  const accel=1+speed/100;
  for (const t of TECHS){
    const to=need[t.id]; if(!to) continue;
    const from=levels[t.id]||0; if (to<=from) continue;
    const sub=emptyRes(); let m=0;
    for (let k=from+1;k<=to;k++){ const c=levelCost(t,k); RES.forEach(r=>sub[r]+=c[r]); m+=c.minutes; }
    RES.forEach(r=>total[r]+=sub[r]); minutes+=m/accel; tgReq=Math.max(tgReq,t.tg);
    items.push({ id:t.id, ko:t.ko, from, to, cost:sub, minutes:m/accel });
  }
  return { items, total, minutes, tgReq };
}

/** 그룹 필터 → 허용 tech Set (공용 연구는 항상 포함) */
export function allowedSet(group){
  if (!group || group==="전체") return null;
  return new Set(TECHS.filter(t=> t.group===group || t.group==="경제" || t.group==="부대").map(t=>t.id));
}
