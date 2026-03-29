Family Benefit Manager
로컬 기반 가족 복지 / 혜택 관리 시스템

개인 및 가족 구성원의 정보를 기반으로
받을 수 있는 복지 및 혜택을 자동으로 필터링하고 관리하는
로컬 저장 기반 웹 애플리케이션입니다.

📌 프로젝트 목표
가족 구성원별 복지 혜택 자동 추천

로컬 저장 기반 (개인정보 보호)

가족 그룹 공유

정부 / 지자체 / 기타 혜택 통합 관리

Import / Export 지원

✨ 주요 기능
1. 가족 그룹 관리
가족 생성

가족 구성원 추가

관계 설정

예시

아빠 (본인)

와이프

아들

딸

2. 구성원 프로필 관리
구성원별 정보 입력

예

생년월일

성별

직업

소득

장애 여부

학생 여부

지역

3. 복지 혜택 자동 필터
입력된 프로필 기반 자동 추천

예

정부 지원금

지자체 복지

교육 지원

장애인 혜택

청년 지원

노인 지원

4. 가족 정보 공유
로컬 기반 공유 방식

가족정보 내보내기

가족정보 불러오기

JSON 파일 기반

🔒 개인정보 보호 설계
서버 저장 없음

로컬 저장 기반

외부 전송 없음

오프라인 사용 가능

🧠 시스템 구조
Family
 ├── Members
 │    ├── Profile
 │    ├── Filters
 │    └── Benefits
🛠 기술 스택
Frontend

React

TypeScript

Vite

Storage

IndexedDB

LocalStorage

기타

PWA

JSON Import / Export

📂 프로젝트 구조
family-benefit-manager/

├── docs/
├── public/
├── src/
│   ├── core/
│   ├── features/
│   ├── components/
│   ├── types/
│   └── utils/
│
└── data/
🚀 설치 방법
git clone https://github.com/your-repo/family-benefit-manager.git

cd family-benefit-manager

npm install

npm run dev
📦 빌드
npm run build
🔄 데이터 저장 방식
기본 저장

IndexedDB

보조 저장

LocalStorage

📤 Import / Export
지원 기능

가족 정보 내보내기

가족 정보 불러오기

파일 형식

.json
📅 로드맵
v0.1
가족 구성원 관리

프로필 입력

v0.2
복지 필터 엔진

v0.3
혜택 추천 기능

v0.4
Import / Export

v1.0
PWA 지원

모바일 지원

🎯 향후 기능
복지 API 연동

지자체 API 연동

자동 업데이트

클라우드 동기화 (옵션)

🤝 기여
Pull Request 환영합니다

📄 License
MIT License

💡 프로젝트 배경
가족 구성원별로 받을 수 있는 복지 혜택을
놓치지 않기 위해 개발된 프로젝트입니다.

특히

가족 단위 관리

개인정보 보호

로컬 기반 저장

에 초점을 맞췄습니다.

📬 문의
이슈 등록 또는 Pull Request 주세요