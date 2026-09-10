import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";
import { DEFAULT_COSTS, DEFAULT_BOXES } from "./defaultData.js";
import Calculator from "./Calculator.jsx";
import Admin from "./Admin.jsx";
import Research from "./Research.jsx";
import { C, font, btn } from "./ui.jsx";

const routeOf = () => { const h=window.location.hash; return h==="#admin"?"admin":h==="#research"?"research":"build"; };

export default function App() {
  const [costs,setCosts] = useState(null);
  const [boxes,setBoxes] = useState(null);
  const [source,setSource] = useState("");
  const [route,setRoute] = useState(routeOf);

  useEffect(()=>{
    const onHash = ()=>setRoute(routeOf());
    window.addEventListener("hashchange",onHash);
    return ()=>window.removeEventListener("hashchange",onHash);
  },[]);

  useEffect(()=>{
    (async ()=>{
      if(!supabase){ setCosts(DEFAULT_COSTS); setBoxes(DEFAULT_BOXES); setSource("내장 기본값 (Supabase 미연결)"); return; }
      const [c,b] = await Promise.all([
        supabase.from("tg8_costs").select("*").order("sort_order"),
        supabase.from("tg8_box_values").select("*").order("sort_order"),
      ]);
      if(c.error || !c.data?.length){ setCosts(DEFAULT_COSTS); setBoxes(DEFAULT_BOXES); setSource("내장 기본값 (DB 조회 실패: "+(c.error?.message||"데이터 없음")+")"); return; }
      setCosts(c.data);
      setBoxes(b.error||!b.data?.length ? DEFAULT_BOXES : b.data);
      setSource("Supabase 기준표 (관리자 최신 수정본)");
    })();
  },[]);

  const go = r => { window.location.hash = r==="build"?"":`#${r}`; setRoute(r); };
  const tabBtn = (r,label) => (
    <button style={{...btn,...(route===r?{background:C.brass,color:"#1A1F17",fontWeight:700}:{})}} onClick={()=>go(r)}>{label}</button>
  );

  return (
    <div style={{background:C.bg,color:C.ink,fontFamily:font,minHeight:"100vh",padding:"20px 18px 40px"}}>
      <style>{`@media (max-width:820px){.tg8grid{grid-template-columns:1fr !important}}
        input:focus,select:focus,button:focus-visible{outline:2px solid ${C.brass};outline-offset:1px}`}</style>
      <div style={{maxWidth:1180,margin:"0 auto"}}>
        <header style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"8px 16px",marginBottom:18}}>
          <h1 style={{fontSize:22,fontWeight:800,margin:0}}>킹샷 TG 계산기</h1>
          <span style={{color:C.dim,fontSize:13}}>Made by 프랜시스 베이컨(943) · 자원 백만(M) 단위</span>
          <span style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
            {tabBtn("build","TG8 건설")}
            {tabBtn("research","고급 순금 연구")}
            {tabBtn("admin","관리자")}
          </span>
        </header>

        {route==="research" ? <Research/>
          : !costs ? <div style={{color:C.dim}}>기준표를 불러오는 중…</div>
          : route==="admin" ? <Admin costs={costs} boxes={boxes} onClose={()=>go("build")}
                      onSaved={(c,b)=>{setCosts(c);setBoxes(b);setSource("Supabase 기준표 (방금 저장)");}}/>
          : <Calculator costs={costs} boxes={boxes} source={source}/>}
      </div>
    </div>
  );
}
