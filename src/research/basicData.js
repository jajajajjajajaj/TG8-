// 킹샷 전쟁아카데미 일반 순금 연구 (Truegold Research, T11 해제 트리) 기준 데이터
// 출처: kingshotdata.com/war-academy-research, kingshot.net (2026-09 기준)
// 보병·기병·궁병 3트리 × 10연구 = 30연구, 264레벨. 세 트리의 비용·시간은 동일.
import { RES, RES_KO, RES_UNIT, RES_SCALE } from "./data.js";

// ── 레벨별 비용표: [빵(=목재), 석재, 철광, 골드, 순금가루, 시간(분)]
const T = {
  battalion: [
    [300000,60000,15000,5000,16,480],[480000,96000,24000,8000,25,768],[780000,150000,39000,13000,41,1248],
    [1200000,250000,64000,21000,68,2064],[2000000,400000,100000,33000,108,3240],
  ],
  stat8: [ // 치명·체력 (8레벨)
    [800000,160000,40000,10000,40,1200],[1100000,220000,56000,14000,56,1680],[1400000,290000,74000,18000,74,2220],
    [2000000,400000,100000,25000,102,3060],[2700000,540000,130000,34000,136,4080],[3600000,730000,180000,46000,184,5520],
    [4900000,990000,240000,62000,248,7440],[6600000,1300000,330000,83000,334,10020],
  ],
  stat12: [ // 공격·방어 (12레벨)
    [700000,140000,35000,15000,54,1135],[860000,170000,43000,18000,66,1396],[1000000,210000,52000,22000,81,1703],
    [1200000,250000,63000,27000,97,2044],[1500000,300000,77000,33000,118,2498],[1800000,370000,94000,40000,145,3066],
    [2300000,460000,110000,49000,178,3747],[2800000,560000,140000,60000,216,4542],[3500000,700000,170000,75000,270,5678],
    [4200000,840000,210000,90000,324,6814],[5000000,1000000,250000,100000,388,8176],[6200000,1200000,310000,130000,480,10107],
  ],
  legion: [
    [1000000,210000,54000,23000,83,1760],[1300000,260000,66000,28000,102,2165],[1600000,320000,81000,34000,125,2640],
    [1900000,390000,97000,41000,150,3168],[2300000,470000,110000,51000,184,3872],[2900000,580000,140000,62000,225,4752],
    [3500000,710000,170000,76000,276,5808],[4300000,860000,210000,93000,334,7041],[5400000,1000000,270000,110000,418,8801],
    [6500000,1300000,320000,130000,502,10561],[7800000,1500000,390000,160000,602,12674],[9600000,1900000,480000,200000,744,15666],
  ],
  unlock: [[85000000,17000000,4200000,1000000,2236,131535]],
  cost10: [ // 치료·훈련 (10레벨)
    [2500000,500000,120000,30000,102,3000],[3300000,670000,160000,40000,137,4050],[4600000,920000,230000,55000,188,5550],
    [6200000,1200000,310000,75000,255,7500],[8300000,1600000,410000,100000,341,10050],[11000000,2200000,560000,130000,459,13500],
    [15000000,3000000,750000,180000,612,18000],[20000000,4100000,1000000,240000,836,24600],[27000000,5500000,1300000,330000,1122,33000],
    [37000000,7500000,1800000,450000,1500,45000],
  ],
  aid10: [
    [1200000,250000,62000,15000,51,1500],[1600000,330000,84000,20000,68,2025],[2300000,460000,110000,27000,94,2775],
    [3100000,620000,150000,37000,127,3750],[4100000,830000,200000,50000,170,5025],[5600000,1100000,280000,67000,229,6750],
    [7500000,1500000,370000,90000,306,9000],[10000000,2000000,510000,120000,418,12300],[13000000,2700000,680000,160000,561,16500],
    [18000000,3700000,930000,220000,765,22500],
  ],
};

// ── 레벨별 효과 증가량
const EFF = {
  battalion: [200,200,200,200,200],
  stat8:  [1.5,1.5,3,3,3,3,5,5],
  stat12: [2,2,2,2.5,2.5,3,3,3,5,5,5,5],
  legion: [1500,1500,2000,2000,2500,2500,2500,3000,3500,4000,4000,4500],
  unlock: [0],
  cost10: [5,5,5,5,5,5,5,5,5,5],
  aid10:  [1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5],
};

// ── 레벨별 요구 조건 (전쟁아카데미 TG, 선행 연구 레벨). 자기 자신의 직전 레벨은 자동.
//   p = 트리 안의 id 매핑 { bat, leth, hp, atk, def, leg, unlock }
const REQ = {
  battalion: (L,p)=>({ tg:1, pre:[] }),
  stat8:  (L,p)=>({ tg:[1,2,2,2,3,3,4,5][L-1], pre: L===1?[[p.bat,3]] : L===4?[[p.bat,4]] : L===5?[[p.bat,5]] : [] }),
  atk12:  (L,p)=>({ tg:[3,3,4,4,4,4,5,5,5,5,5,5][L-1], pre: L===1?[[p.leth,6]] : L===7?[[p.leth,7]] : L===8?[[p.leth,8]] : [] }),
  def12:  (L,p)=>({ tg:[3,3,4,4,4,4,5,5,5,5,5,5][L-1], pre: L===1?[[p.hp,6]] : L===7?[[p.hp,7]] : L===8?[[p.hp,8]] : [] }),
  legion: (L,p)=>({ tg:[4,4,4,5,5,5,5,5,5,5,5,5][L-1], pre: L===1?[[p.leth,6],[p.hp,6]] : L===7?[[p.leth,7],[p.hp,7]] : L===8?[[p.leth,8],[p.hp,8]] : [] }),
  unlock: (L,p)=>({ tg:5, pre:[[p.atk,12],[p.def,12],[p.leg,12]] }),
  after:  (L,p)=>({ tg:5, pre: L===1?[[p.unlock,1]] : [] }),
};

// ── 병종별 연구 정의: [키, 한글명, 영문명, 효과 라벨, 비용표, 효과표, 요구규칙, 단위]
const TROOPS = [
  { key:"inf", group:"보병", en:"Infantry", ko:"보병",
    leth:["순금 검","Truegold Blades"], hp:["순금 방패","Truegold Shields"], atk:["순금 망치","Truegold Mauls"], def:["순금 장갑","Truegold Plating"] },
  { key:"cav", group:"기병", en:"Cavalry", ko:"기병",
    leth:["순금 돌진","Truegold Charge"], hp:["순금 편자","Truegold Farriery"], atk:["순금 창","Truegold Lances"], def:["순금 판금","Truegold Platecraft"] },
  { key:"arc", group:"궁병", en:"Archer", ko:"궁병",
    leth:["순금 활","Truegold Bows"], hp:["순금 완갑","Truegold Bracers"], atk:["순금 화살","Truegold Arrows"], def:["순금 조끼","Truegold Vests"] },
];

export const TECHS = [];
for (const t of TROOPS){
  const id = s => `${t.key}_${s}`;
  const p = { bat:id("bat"), leth:id("leth"), hp:id("hp"), atk:id("atk"), def:id("def"), leg:id("leg"), unlock:id("unlock") };
  const mk = (slug, ko, en, effect, cost, eff, req, unit, prereqs) => TECHS.push({
    id:id(slug), ko, en, effect, group:t.group, tier:t.group, tg:1, template:cost,
    prereqs, maxLevel:T[cost].length, unit, _eff:EFF[eff], _req:L=>REQ[req](L,p),
  });
  mk("bat",  "순금 대대",           `Truegold Battalion (${t.en})`,   "부대 출정 용량", "battalion","battalion","battalion","", []);
  mk("leth", t.leth[0],             t.leth[1],                          `${t.ko} 치명`,    "stat8","stat8","stat8","%", [p.bat]);
  mk("hp",   t.hp[0],               t.hp[1],                            `${t.ko} 체력`,    "stat8","stat8","stat8","%", [p.bat]);
  mk("atk",  t.atk[0],              t.atk[1],                           `${t.ko} 공격`,    "stat12","stat12","atk12","%", [p.leth]);
  mk("def",  t.def[0],              t.def[1],                           `${t.ko} 방어`,    "stat12","stat12","def12","%", [p.hp]);
  mk("leg",  "순금 군단병",         `Truegold Legionaries (${t.en})`, "집결 용량",       "legion","legion","legion","", [p.leth,p.hp]);
  mk("unlock",`순금 ${t.ko}`,       `Truegold ${t.en}`,                 `T11 순금 ${t.ko} 해제`, "unlock","unlock","unlock","", [p.atk,p.def,p.leg]);
  mk("heal", `순금 ${t.ko} 치료`,   `Truegold ${t.en} Healing`,         `순금 ${t.ko} 치료 비용 감소`, "cost10","cost10","after","%", [p.unlock]);
  mk("aid",  `순금 ${t.ko} 구급`,   `Truegold ${t.en} Aid`,             `순금 ${t.ko} 치료 시간 감소`, "aid10","aid10","after","%", [p.unlock]);
  mk("train",`순금 ${t.ko} 훈련`,   `Truegold ${t.en} Training`,        `순금 ${t.ko} 훈련 비용 감소`, "cost10","cost10","after","%", [p.unlock]);
}

export const TECH_BY_ID = Object.fromEntries(TECHS.map(t=>[t.id,t]));
export const TIERS = ["보병","기병","궁병"];

export function levelCost(tech, L){
  const [bread,stone,iron,gold,dust,minutes] = T[tech.template][L-1];
  return { bread, wood:bread, stone, iron, gold, dust, tempered:0, minutes };
}
export function effectAt(tech, L){
  if (tech.template==="unlock") return L>=1 ? "해제" : "-";
  let v=0; for(let k=0;k<L;k++) v+=tech._eff[k];
  return `+${Number.isInteger(v)?v.toLocaleString("ko-KR"):v.toFixed(1)}${tech.unit}`;
}
/** 레벨 L로 올리기 위한 조건: { tg, prereqs:[{id,lv}] } (직전 레벨 조건은 엔진이 처리) */
export function requirements(tech, L){
  const r = tech._req(L);
  return { tg:r.tg, prereqs:r.pre.map(([id,lv])=>({id,lv})) };
}
/** 기준표 탭 상단에 보여줄 선행 설명 */
export function prereqNote(tech){
  const lines=[];
  for(let L=1;L<=tech.maxLevel;L++){
    const r=tech._req(L);
    if(r.pre.length) lines.push(`Lv.${L}: ${r.pre.map(([id,lv])=>`${TECH_BY_ID[id].ko} ${lv}`).join("·")}`);
  }
  return lines.join(" / ");
}

export const BASIC = {
  key:"basic", storeKey:"tg8_basic_research_v1",
  RES, RES_KO, RES_UNIT, RES_SCALE,
  TECHS, TECH_BY_ID, TIERS,
  tierLabel: tier => `${tier} 트리`,
  tierTg: tier => "TG1~5",
  groups: ["전체","보병","기병","궁병"],
  sharedGroups: [],
  groupHint: "선택한 병종 트리만 계산",
  tgOptions: [1,2,3,4,5,6,7,8],
  tgHint: "TG1: 대대 · TG2~3: 치명/체력 · TG3~4: 공격/방어 · TG4~5: 군단병 · TG5: 해제 이후",
  maxTg: 5,
  defaultGoal: "inf_unlock",
  levelCost, effectAt, requirements, prereqNote,
  footnote: "수치는 kingshotdata.com / kingshot.net 공개 데이터(반올림 표기) 기준이며 게임 업데이트로 달라질 수 있습니다. 세 병종 트리의 비용·시간은 동일합니다. 한글 연구명은 번역이라 게임 내 표기와 다를 수 있습니다(영문명은 기준표 탭에서 확인).",
};
