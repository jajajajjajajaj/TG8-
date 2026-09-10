// 킹샷 고급 순금 연구 (Advanced Truegold Research) 기준 데이터
// 출처: kingshotdata.com / kingshot.net 데이터베이스 (2026-09 기준)
import { COST_TEMPLATES } from "./costTemplates.js";

export const RES = ["bread","wood","stone","iron","gold","dust","tempered"];
export const RES_KO = { bread:"빵", wood:"목재", stone:"석재", iron:"철광", gold:"골드", dust:"순금 가루", tempered:"정련 순금" };
export const RES_UNIT = { bread:"M", wood:"M", stone:"M", iron:"M", gold:"M", dust:"개", tempered:"개" };
export const RES_SCALE = { bread:1e6, wood:1e6, stone:1e6, iron:1e6, gold:1e6, dust:1, tempered:1 };

// 선행 연구 레벨 규칙: 내 레벨 L을 올리려면 선행 연구가 P[L] 이상이어야 함 (10레벨 연구 공통)
export const PREREQ_LEVEL = [0,1,1,3,3,3,6,6,6,6,10];

const ROMAN = ["","I","II","III","IV","V","VI"];

// 병종별 12개 연구 (한글명, 영문명, 효과 라벨, 병종)
const TROOP = [
  ["황금 철퇴","Auric Mauls","보병 공격","보병"],
  ["순금 창","Truegold Lances","기병 공격","기병"],
  ["황금 화살촉","Auric Arrowheads","궁병 공격","궁병"],
  ["황금 판금","Auric Plating","보병 방어","보병"],
  ["황금 망토","Golden Mantle","기병 방어","기병"],
  ["황금 견갑","Auric Pauldrons","궁병 방어","궁병"],
  ["황금 파괴","Auric Destruction","보병 치명","보병"],
  ["진정한 충격","True Shock","기병 치명","기병"],
  ["황금 활","Golden Bows","궁병 치명","궁병"],
  ["황금 방패","Golden Shield","보병 체력","보병"],
  ["황금 편자","Golden Horseshoes","기병 체력","기병"],
  ["황금 팔보호대","Auric Bracers","궁병 체력","궁병"],
];

function tech(id, ko, en, effect, group, tier, tg, template, prereqs, opts={}) {
  return { id, ko, en, effect, group, tier, tg, template, prereqs, maxLevel: opts.maxLevel||10, perLevel: opts.perLevel ?? 3, unit: opts.unit ?? "%" };
}

export const TECHS = [];
const push = t => { TECHS.push(t); return t; };

// ── 경제·유틸 (TG5)
push(tech("chests","순금 상자","Chests of Gold","6번째 일일임무 상자 순금","경제","기본",5,"T5a",[],{perLevel:1,unit:"개"}));
push(tech("weaponry","순금 무기","Truegold Weaponry","훈련 속도","경제","기본",5,"T5b",["chests"],{perLevel:4}));
push(tech("barracks","순금 병영","Truegold Barracks","훈련 용량","경제","기본",5,"T5b",["chests"],{perLevel:15,unit:""}));
push(tech("intel","순금 정보","Truegold Intel","야수 사냥 추가 순금 확률","경제","기본",5,"T5a",["weaponry","barracks"],{perLevel:10}));
push(tech("infirm","순금 의무실","Truegold Infirmaries","의무실 용량","경제","기본",5,"T5b",["intel"],{perLevel:5000,unit:""}));
push(tech("bandage","신속 붕대","Quick Bandage","치료 속도","경제","기본",5,"T5b",["intel"],{perLevel:6}));
push(tech("supply","한정 공급","Limited Supply","반값 순금가루 교환 횟수","경제","기본",5,"T5a",["infirm","bandage"],{perLevel:2,unit:"회"}));

// ── 병종 티어 I~VI
const TIER = [
  null,
  { tg:6, tpl:"T6a", entry:["supply"],  tail:{ id:"prov1", ko:"순금 보급 I",  en:"Truegold Provisions I",  effect:"부대 출정 용량", perLevel:1000, unit:"" } },
  { tg:6, tpl:"T6b", entry:["prov1"],   tail:{ id:"prov2", ko:"순금 보급 II", en:"Truegold Provisions II", effect:"부대 출정 용량", perLevel:1000, unit:"" } },
  { tg:7, tpl:"T7a", entry:["prov2"],   tail:{ id:"gen1",  ko:"순금 세대 I",  en:"Generation Truegold I",  effect:"집결 용량", perLevel:10000, unit:"" } },
  { tg:7, tpl:"T7b", entry:["gen1"],    tail:{ id:"gen2",  ko:"순금 세대 II", en:"Generation Truegold II", effect:"집결 용량", perLevel:10000, unit:"" } },
  { tg:8, tpl:"T8a", entry:["gen2"],    squad:1 },
  { tg:8, tpl:"T8b", entry:["heart1"],  squad:2 },
];

for (let t=1;t<=6;t++){
  const T=TIER[t]; const r=ROMAN[t];
  const ids = TROOP.map((_,i)=>`${["mauls","lances","arrow","plating","mantle","pauldrons","destr","shock","bows","shield","horseshoe","bracers"][i]}${t}`);
  const mk=(i,prereqs)=>push(tech(ids[i],`${TROOP[i][0]} ${r}`,`${TROOP[i][1]} ${r}`,TROOP[i][2],TROOP[i][3],`${r}`,T.tg,T.tpl,prereqs));
  // 공격 3종 → 방어 3종
  for(let i=0;i<3;i++) mk(i,T.entry);
  for(let i=3;i<6;i++) mk(i,[ids[i-3]]);
  let lethEntry = i=>[ids[i-3]];
  if (T.squad){
    // 부대 공격/방어 (방어 3종 선행) → 치명 3종은 부대 방어 선행
    const s=T.squad;
    push(tech(`arm${s}`,`순금 무장 ${ROMAN[s]}`,`Truegold Armaments ${ROMAN[s]}`,"부대 공격","부대",`${r}`,T.tg,T.tpl,[ids[3],ids[4],ids[5]],{perLevel:1.5}));
    push(tech(`armor${s}`,`순금 갑옷 ${ROMAN[s]}`,`Truegold Armor ${ROMAN[s]}`,"부대 방어","부대",`${r}`,T.tg,T.tpl,[`arm${s}`],{perLevel:1.5}));
    lethEntry = ()=>[`armor${s}`];
  }
  for(let i=6;i<9;i++) mk(i,lethEntry(i));
  for(let i=9;i<12;i++) mk(i,[ids[i-3]]);
  if (T.tail){
    const x=T.tail;
    push(tech(x.id,x.ko,x.en,x.effect,"부대",`${r}`,T.tg,T.tpl,[ids[9],ids[10],ids[11]],{perLevel:x.perLevel,unit:x.unit}));
  } else {
    const s=T.squad;
    push(tech(`bounty${s}`,`순금 현상금 ${ROMAN[s]}`,`Truegold Bounties ${ROMAN[s]}`,"부대 치명","부대",`${r}`,T.tg,T.tpl,[ids[9],ids[10],ids[11]],{perLevel:1.5}));
    push(tech(`heart${s}`,`황금의 심장 ${ROMAN[s]}`,`Heart of Gold ${ROMAN[s]}`,"부대 체력","부대",`${r}`,T.tg,T.tpl,[`bounty${s}`],{perLevel:1.5}));
  }
}

// ── 순금 보급 III (100레벨, 황금의 심장 II 10레벨 필요)
push(tech("prov3","순금 보급 III","Truegold Provisions III","부대 출정 용량","부대","최종",8,"P3",["heart2"],{maxLevel:100,perLevel:0,unit:""}));

export const TECH_BY_ID = Object.fromEntries(TECHS.map(t=>[t.id,t]));
export const TIERS = ["기본","I","II","III","IV","V","VI","최종"];

// ── 레벨별 비용
const bracket = L => L<=3?0:L<=6?1:L<=9?2:3;

function prov3Row(L){
  const gold = L<=49 ? 151000+15062.5*(L-1) : L<=70 ? 904000+30125*(L-50) : 1506500+60250*(L-70);
  const bread = gold*50;
  const dust = L<=49 ? 500+50*(L-1) : L<=70 ? 3000+100*(L-50) : 5000+200*(L-70);
  const tempered = L<=49 ? 20+2*(L-1) : L<=70 ? 120+4*(L-50) : 200+8*(L-70);
  const hours = L<=49 ? 301+30.15*(L-1) : L<=70 ? 1808+60.3*(L-50) : 3013+120.6*(L-70);
  return { bread, wood:bread, stone:bread/5, iron:bread/20, gold, dust, tempered, minutes:hours*60 };
}
const PROV3_EFFECT = (()=>{ // 누적 출정 용량
  const inc = L => L<=5?200:L<=10?210:L<=20?220:L<=30?240:L<=40?280:L<=49?320:L===50?340:L<=55?370:L<=60?400:L<=65?430:L<=70?460:L<=75?490:L<=80?550:L<=85?600:L<=90?650:L<=95?700:750;
  const out=[0]; for(let L=1;L<=100;L++) out.push(out[L-1]+inc(L)); return out;
})();

/** tech의 level(1-based)로 올리는 비용 */
export function levelCost(tech, L){
  if (tech.template==="P3") return prov3Row(L);
  const [bread,stone,iron,gold,dust,tempered,hours] = COST_TEMPLATES[tech.template][bracket(L)];
  return { bread, wood:bread, stone, iron, gold, dust, tempered, minutes:hours*60 };
}
/** tech의 level에서 누적 효과 표시 문자열 */
export function effectAt(tech, L){
  if (tech.template==="P3") return `+${PROV3_EFFECT[L].toLocaleString("ko-KR")}`;
  const v = tech.perLevel*L;
  return `+${Number.isInteger(v)?v.toLocaleString("ko-KR"):v.toFixed(1)}${tech.unit}`;
}
/** 선행 연구 요구 레벨 */
export function prereqLevel(tech, L, parentId){
  if (tech.id==="prov3") return 10;            // 황금의 심장 II 10레벨 고정
  return PREREQ_LEVEL[L];
}
