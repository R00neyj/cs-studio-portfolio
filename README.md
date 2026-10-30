# CS Automation Studio — Technical Case Study

비즈니스 채널 문의를 읽음 표시 없이 읽고, 개인정보를 PC 안에서 가린 뒤 AI로 답변 초안을 다듬는 사내 CS 도구의 케이스 스터디 페이지입니다. 스크롤하면 아이소메트릭 그래픽과 애니메이션으로 작동 흐름을 보여 줍니다.

> 이 저장소는 사내 저장소와 기록을 나누려고 빈 저장소(`git init`)에서 따로 만들었습니다. 화면에 나오는 고객사·도메인·연락처·금액은 모두 가짜 예시이고, 내부 주소는 들어 있지 않습니다.

## 페이지 구성

| 구역 | 보여 주는 것 |
| --- | --- |
| `#top` | 화면·데스크톱 메인·서버 세 판 사이로 문의가 가려진 채 내려갔다 답변 초안으로 올라오는 반복 그림 |
| `#flow` | 문의 하나가 답변이 되기까지 다섯 단계: 감지, 매칭(기준 50점), 가림, 다듬기와 빠진 값 검사(`keepFrom`), 복사 |
| `#ipc` | 데스크톱 앱 네 겹(화면, preload 다리, Electron 메인, 분리된 프로세스·세션)을 벌려 요청이 통과하거나 막히는 경로 |
| `#runtime` | 같은 React 번들이 웹·데스크톱으로 갈라지고 Worker(KV·D1·Cron)를 함께 쓰는 구조, 노션 동기화 3.8MB에서 2.1MB, 토큰 없는 302 업데이트 |
| `#bundle` | 2주 안 만료 항목을 안내문 한 통으로 묶고 기록은 D1 행 하나씩 남기는 과정, 실패하면 앞선 기록을 되돌리는 모습 |
| `#ocr` | 캡처 속 빨간 표시로 수정 건수 세기(합성 15장 45/45건)와 엔진 선정(PaddleOCR 96%) |
| `#demo` | 직접 눌러 보는 업무 화면 |
| `#engineering`, `#specs` | 문제 해결 기록 6건과 기술 사양 |

## 시스템 요약

- 하나의 React 19 번들이 웹(Cloudflare Workers)과 데스크톱(Electron)에서 돕니다. `window.electronAPI`가 있으면 데스크톱 기능을 켭니다.
- Electron 메인: 분리된 세션(`persist:monitor`)의 숨김 창으로 방을 열지 않고 문의를 읽습니다. PaddleOCR(PP-OCRv5, onnxruntime-node CPU)은 메인 프로세스에서 돌고, 로컬 AI(Gemma 4, node-llama-cpp)는 `utilityProcess`에서 따로 돕니다. 외부 계정 비밀번호는 메인만 보관하고 화면으로 돌려주지 않습니다.
- 화면: 템플릿은 AI 없이 키워드 점수로 찾습니다(`MIN_REPRESENTATIVE_SCORE = 50`). 서버 AI로 보내기 직전 고객사·고객·도메인·연락처·이메일·긴 번호를 `[고객사1]`, `[도메인1]`, `[연락처1]`, `[번호1]` 같은 자리표시로 바꾸고, 다듬은 답에서 번호·연락처·도메인이 빠지면 버립니다.
- Worker: 통째로 읽고 쓰는 자료(템플릿·프로젝트)는 KV, 행 단위 기록(호스팅·SSL·문자 안내, 공유 메모 등)은 D1에 둡니다. 자동 업데이트는 앱에 GitHub 토큰을 넣지 않고 Worker가 세션 토큰을 확인한 뒤 302로 넘깁니다.

## 파일 구조

```text
index.html            페이지 마크업
css/style.css         공통 토큰·컴포넌트·업무 화면 데모
css/iso.css           아이소메트릭 그래픽·스크롤 장면 공통 스타일
css/scenes/*.css      장면별 스타일(hero, flow, ipc, runtime, bundle, ocr)
js/theme-init.js      첫 화면 전에 라이트·다크 테마 적용
js/iso-kit.js         아이소 투영·도형·장면 연결 도구(window.IsoKit)
js/scenes/*.js        장면별 그림과 GSAP 타임라인
js/demo.js            업무 화면 데모, 테마 전환, 메뉴 표시
```

GSAP 3.13과 ScrollTrigger는 jsDelivr CDN에서 불러옵니다. 불러오지 못하거나 '움직임 줄이기'가 켜져 있으면 각 장면의 마지막 그림을 그대로 보여 줍니다.

## 로컬 실행과 GitHub Pages 배포

빌드 과정이 없습니다. `index.html`을 브라우저로 열거나 아무 정적 서버로 띄우면 됩니다.

```bash
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

푸시한 뒤 GitHub 저장소의 Settings > Pages > Build and deployment에서 Branch를 `main`(`/root`)으로 지정하면 배포됩니다.
