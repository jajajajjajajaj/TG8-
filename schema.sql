-- 킹샷 TG 건설 계산기 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하세요.

-- 1) 건설 기준표 (원본 수치: 할인·가속 적용 전)
create table if not exists public.tg8_costs (
  id                  integer primary key,
  sort_order          integer not null,
  building            text not null,
  stage               text not null,
  gold                numeric not null default 0,
  refined_gold        numeric not null default 0,
  food                numeric not null default 0,   -- 백만(M)
  wood                numeric not null default 0,
  stone               numeric not null default 0,
  iron                numeric not null default 0,
  minutes_per_upgrade numeric not null default 0,   -- 업그레이드 1건 시간(분)
  updated_at          timestamptz not null default now(),
  unique (building, stage)
);

-- 2) 자원 선택 상자 1개당 지급량 (M)
create table if not exists public.tg8_box_values (
  resource   text primary key,
  sort_order integer not null,
  lv1        numeric not null,
  lv2        numeric not null,
  lv3        numeric not null,
  updated_at timestamptz not null default now()
);

-- 3) 관리자 목록 — 여기에 등록된 사용자만 수정 가능
create table if not exists public.tg8_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note    text
);

-- 4) 기준 데이터 삽입 (이미 있으면 건너뜀)
insert into public.tg8_costs (id,sort_order,building,stage,gold,refined_gold,food,wood,stone,iron,minutes_per_upgrade) values
  (25,1,'도시센터','Lv30→TG1',660,0,335,335,65,16.5,10080),
  (26,2,'도시센터','TG1→TG2',790,0,360,360,70,18,12960),
  (27,3,'도시센터','TG2→TG3',1190,0,395,395,75,19.5,15840),
  (28,4,'도시센터','TG3→TG4',1400,0,410,410,80,20.5,17280),
  (29,5,'도시센터','TG4→TG5',1675,0,420,420,80,21,20160),
  (1,6,'도시센터','TG5→TG6',900,60,480,480,95,24,21600),
  (2,7,'도시센터','TG6→TG7',1080,90,500,500,105,27,25920),
  (3,8,'도시센터','TG7→TG8',1080,120,650,650,130,33,28800),
  (30,11,'대사관','Lv30→TG1',165,0,65,65,13.5,3.35,6652),
  (31,12,'대사관','TG1→TG2',195,0,70,70,14.5,3.6,8553),
  (32,13,'대사관','TG2→TG3',295,0,75,75,15.5,3.95,10454),
  (33,14,'대사관','TG3→TG4',350,0,80,80,16,4.1,11404),
  (34,15,'대사관','TG4→TG5',415,0,80,80,16.5,4.2,13305),
  (4,16,'대사관','TG5→TG6',225,13,95,95,19,4.8,14256),
  (5,17,'대사관','TG6→TG7',270,19,105,105,21.5,5,17107),
  (6,18,'대사관','TG7→TG8',270,30,130,130,26.5,6.5,19008),
  (35,21,'보병대','Lv30→TG1',295,0,115,115,23.5,5.5,1512),
  (36,22,'보병대','TG1→TG2',355,0,125,125,25,6,1944),
  (37,23,'보병대','TG2→TG3',535,0,135,135,27.5,6.5,2376),
  (38,24,'보병대','TG3→TG4',630,0,140,140,28.5,7,2592),
  (39,25,'보병대','TG4→TG5',750,0,145,145,29.5,7,3024),
  (7,26,'보병대','TG5→TG6',405,25,165,165,33.5,8,3240),
  (8,27,'보병대','TG6→TG7',486,37,190,190,38,9.5,3888),
  (9,28,'보병대','TG7→TG8',486,54,230,230,46.5,11.5,4320),
  (40,31,'기병대','Lv30→TG1',295,0,115,115,23.5,5.5,1512),
  (41,32,'기병대','TG1→TG2',355,0,125,125,25,6,1944),
  (42,33,'기병대','TG2→TG3',535,0,135,135,27.5,6.5,2376),
  (43,34,'기병대','TG3→TG4',630,0,140,140,28.5,7,2592),
  (44,35,'기병대','TG4→TG5',750,0,145,145,29.5,7,3024),
  (10,36,'기병대','TG5→TG6',405,25,165,165,33.5,8,3240),
  (11,37,'기병대','TG6→TG7',486,37,190,190,38,9.5,3888),
  (12,38,'기병대','TG7→TG8',486,54,230,230,46.5,11.5,4320),
  (45,41,'궁병대','Lv30→TG1',295,0,115,115,23.5,5.5,1512),
  (46,42,'궁병대','TG1→TG2',355,0,125,125,25,6,1944),
  (47,43,'궁병대','TG2→TG3',535,0,135,135,27.5,6.5,2376),
  (48,44,'궁병대','TG3→TG4',630,0,140,140,28.5,7,2592),
  (49,45,'궁병대','TG4→TG5',750,0,145,145,29.5,7,3024),
  (13,46,'궁병대','TG5→TG6',405,25,165,165,33.5,8,3240),
  (14,47,'궁병대','TG6→TG7',486,37,190,190,38,9.5,3888),
  (15,48,'궁병대','TG7→TG8',486,54,230,230,46.5,11.5,4320),
  (50,51,'지휘부','Lv30→TG1',130,0,100,100,20,5,1209.5),
  (51,52,'지휘부','TG1→TG2',155,0,105,105,21.5,5,1555),
  (52,53,'지휘부','TG2→TG3',235,0,115,115,23.5,5.5,1900),
  (53,54,'지휘부','TG3→TG4',280,0,120,120,24.5,6,2073),
  (54,55,'지휘부','TG4→TG5',335,0,125,125,25,6,2419),
  (16,56,'지휘부','TG5→TG6',180,13,145,145,29,7,2592),
  (17,57,'지휘부','TG6→TG7',216,19,160,160,32.5,8,3110),
  (18,58,'지휘부','TG7→TG8',216,24,195,195,39.5,9.5,3456),
  (55,61,'병원','Lv30→TG1',130,0,80,80,16.5,4.2,1411),
  (56,62,'병원','TG1→TG2',155,0,90,90,18,4.5,1814),
  (57,63,'병원','TG2→TG3',235,0,95,95,19.5,4.95,2217),
  (58,64,'병원','TG3→TG4',280,0,100,100,20.5,5,2419),
  (59,65,'병원','TG4→TG5',335,0,105,105,21,5,2822),
  (19,66,'병원','TG5→TG6',180,13,120,120,24,6,3000),
  (20,67,'병원','TG6→TG7',216,19,135,135,27,6.5,3600),
  (21,68,'병원','TG7→TG8',216,24,165,165,33,8,4020),
  (60,72,'전쟁아카데미','TG1→TG2',355,0,180,180,36,9,2592),
  (61,73,'전쟁아카데미','TG2→TG3',535,0,195,195,39.5,9.5,3168),
  (62,74,'전쟁아카데미','TG3→TG4',630,0,205,205,41,10,3456),
  (63,75,'전쟁아카데미','TG4→TG5',750,0,210,210,41,10.5,4032),
  (22,76,'전쟁아카데미','TG5→TG6',405,25,240,240,48,12,4320),
  (23,77,'전쟁아카데미','TG6→TG7',486,37,270,270,50,13.5,5184),
  (24,78,'전쟁아카데미','TG7→TG8',486,54,330,330,65,16.5,5760)
on conflict (id) do nothing;

insert into public.tg8_box_values (resource,sort_order,lv1,lv2,lv3) values
  ('식량',1,0.01,0.1,1),
  ('목재',2,0.01,0.1,1),
  ('석재',3,0.002,0.02,0.2),
  ('철광',4,0.0005,0.005,0.05)
on conflict (resource) do nothing;

-- 5) updated_at 자동 갱신
create or replace function public.tg8_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists tg8_costs_touch on public.tg8_costs;
create trigger tg8_costs_touch before update on public.tg8_costs for each row execute function public.tg8_touch();
drop trigger if exists tg8_box_touch on public.tg8_box_values;
create trigger tg8_box_touch before update on public.tg8_box_values for each row execute function public.tg8_touch();

-- 6) 관리자 판별 함수
create or replace function public.tg8_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tg8_admins where user_id = auth.uid());
$$;

-- 7) RLS: 누구나 읽기, 관리자만 쓰기
alter table public.tg8_costs      enable row level security;
alter table public.tg8_box_values enable row level security;
alter table public.tg8_admins     enable row level security;

drop policy if exists "costs read all"   on public.tg8_costs;
drop policy if exists "costs admin write" on public.tg8_costs;
create policy "costs read all"    on public.tg8_costs for select using (true);
create policy "costs admin write" on public.tg8_costs for all
  using (public.tg8_is_admin()) with check (public.tg8_is_admin());

drop policy if exists "box read all"    on public.tg8_box_values;
drop policy if exists "box admin write" on public.tg8_box_values;
create policy "box read all"    on public.tg8_box_values for select using (true);
create policy "box admin write" on public.tg8_box_values for all
  using (public.tg8_is_admin()) with check (public.tg8_is_admin());

-- 관리자 표는 본인 행만 조회 가능(수정은 대시보드에서만)
drop policy if exists "admins self read" on public.tg8_admins;
create policy "admins self read" on public.tg8_admins for select using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 8) 관리자 등록 (마지막 단계!)
--   Authentication > Users 에서 관리자 계정을 먼저 만든 뒤,
--   아래 이메일을 본인 것으로 바꿔 실행하세요.
-- insert into public.tg8_admins (user_id, note)
-- select id, '관리자' from auth.users where email = 'YOUR_EMAIL@example.com'
-- on conflict (user_id) do nothing;
