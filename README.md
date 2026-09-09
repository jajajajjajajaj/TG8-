# 킹샷 TG8 건설 계산기

기준표 수치는 Supabase에 저장되고(누구나 읽기), 로그인한 관리자만 수정할 수 있습니다.
링크를 공유받은 사람은 각자 브라우저에서 보유 자원을 넣고 계산합니다(입력값은 저장되지 않음).

구조: Vite + React → GitHub → Vercel 자동 배포 / 데이터 · 인증: Supabase

---

## 1. Supabase 설정

1. https://supabase.com 에서 새 프로젝트 생성 (리전은 Northeast Asia(Seoul) 추천)
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 내용을 통째로 붙여넣고 **Run**
   - 테이블 3개(`tg8_costs`, `tg8_box_values`, `tg8_admins`), 기준 데이터, RLS 정책이 만들어집니다.
3. **Authentication → Users → Add user** 로 관리자 계정 생성 (이메일 + 비밀번호, "Auto Confirm User" 체크)
4. 다시 **SQL Editor** 에서 아래를 본인 이메일로 바꿔 실행 (관리자 등록):
   ```sql
   insert into public.tg8_admins (user_id, note)
   select id, '관리자' from auth.users where email = 'YOUR_EMAIL@example.com'
   on conflict (user_id) do nothing;
   ```
5. **Project Settings → API** 에서 두 값을 복사해 둡니다:
   - `Project URL`
   - `anon public` 키 (service_role 키는 절대 프론트에 넣지 마세요)

> Authentication → Providers → Email 에서 "Confirm email"이 켜져 있어도, Add user 시 Auto Confirm을 체크했으면 바로 로그인됩니다.

## 2. GitHub에 올리기

```bash
cd tg8-calculator
git init
git add .
git commit -m "TG8 건설 계산기"
git branch -M main
git remote add origin https://github.com/<아이디>/tg8-calculator.git
git push -u origin main
```
(`.env`는 `.gitignore`에 있어 올라가지 않습니다. 키는 Vercel에서 넣습니다.)

## 3. Vercel 배포

1. https://vercel.com → **Add New → Project** → 방금 올린 GitHub 저장소 Import
2. Framework Preset은 **Vite** 로 자동 감지됩니다 (Build: `vite build`, Output: `dist`)
3. **Environment Variables** 에 추가:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | anon public 키 |
4. **Deploy** → 완료되면 `https://tg8-calculator-xxxx.vercel.app` 같은 공개 링크가 생깁니다.
   이후 GitHub `main`에 push 할 때마다 자동으로 재배포됩니다.

## 4. 사용법

- 공개 링크: 누구나 계산기 사용
- 관리자: 오른쪽 위 **관리자** 버튼(또는 주소 뒤에 `#admin`) → 로그인 → 수치 수정 → **변경사항 저장**
  - 저장 즉시 모든 사용자가 새로고침하면 반영됩니다.
  - 관리자 목록에 없는 계정으로 로그인하면 저장이 거부됩니다(RLS).

## 5. 로컬에서 돌려보기

```bash
npm install
cp .env.example .env    # 값 채우기
npm run dev
```
`.env`가 없으면 내장 기본 수치로 동작합니다(관리자 기능은 비활성).

## 파일 구성

```
index.html
src/main.jsx          진입점
src/App.jsx           데이터 로드 + 계산기/관리자 전환
src/Calculator.jsx    계산 로직·화면
src/Admin.jsx         관리자 로그인·기준표 편집
src/defaultData.js    DB 미연결 시 기본값
src/lib/supabase.js   Supabase 클라이언트
src/ui.jsx            공용 스타일
supabase/schema.sql   테이블·시드·RLS
```
