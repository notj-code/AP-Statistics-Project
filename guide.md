네, Vercel 배포를 목표로 하는 Next.js 프로젝트의 최종 구조와 각 파일에 들어갈 핵심 내용을 한눈에 알 수 있도록 정리해 드리겠습니다.

아래 표에 따라 파일을 생성하고 내용을 복사/수정하시면 프로젝트의 모든 핵심 기능이 완성됩니다.

🛠️ 최종 파일 구조 및 내용 요약
1. 환경 설정 파일 (프로젝트 루트)
파일 경로	목적	핵심 내용
.env	DB 및 서버 환경 변수 (Vercel 대시보드에도 등록)	
DATABASE_URL="postgresql://..."


NMC_API_KEY="YOUR_ENCODED_KEY"

.env.local	로컬 개발 환경 변수 (Git에 커밋하지 않음)	NEXT_PUBLIC_KAKAO_MAP_KEY="YOUR_JAVASCRIPT_KEY"
prisma/schema.prisma	데이터베이스 모델 정의	model EmergencyCenter { ... } (2단계 참조)
vercel.json	Vercel 배포 설정 및 Cron Job 설정	/api/data-sync를 주기적으로 실행하도록 설정 (매 5분마다 권장)

Sheets로 내보내기

2. 라이브러리 및 유틸리티 파일
파일 경로	목적	핵심 내용
lib/prisma.ts	Vercel 서버리스 환경 최적화된 DB 연결 인스턴스	Prisma Singleton 패턴으로 DB 연결 풀 관리
data/RegionBoundary.ts	지도 시각화에 필요한 지역 경계 좌표 데이터	export const RegionBoundaryData = [...] (GeoJSON을 가공하여 저장)

Sheets로 내보내기

3. API Routes (백엔드 로직)
파일 경로	목적	핵심 내용
app/api/data-sync/route.ts	Open API 호출 및 DB 갱신 (데이터 수집)	Axios, fast-xml-parser 사용. NMC_API_KEY로 데이터 요청 후, **prisma.upsert**로 DB에 저장
app/api/risk-index/route.ts	지역별 위험 지수 계산	DB에서 지역 데이터를 가져와 Geometric Distribution 공식으로 P(X>3) 계산 후 JSON 반환

Sheets로 내보내기

4. 프론트엔드 컴포넌트
파일 경로	목적	핵심 내용
components/KakaoMapLoader.tsx	Kakao Map 스크립트 로드	next/script 컴포넌트로 NEXT_PUBLIC_KAKAO_MAP_KEY를 사용하여 스크립트 비동기 로드
app/layout.tsx	최상위 레이아웃	**KakaoMapLoader**를 임포트하여 <body> 태그 안에 children을 감싸도록 설정
app/MapComponent.tsx	지도 시각화 (Client Component)	'use client' 지시어 필수. react-kakao-maps-sdk 사용. /api/risk-index를 호출하여 데이터를 가져온 후, **Polygon**으로 경계선과 위험 지수 색상 시각화
app/page.tsx	메인 페이지 (Server Component)	EmergencyMap 컴포넌트 임포트 및 렌더링

Sheets로 내보내기

📂 파일별 핵심 코드 (빠른 복사/붙여넣기)
1. lib/prisma.ts
TypeScript

// lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

// Global 변수로 prisma 인스턴스를 유지하여 Serverless Function의 연결 풀 문제를 해결합니다.
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
2. app/layout.tsx
TypeScript

// app/layout.tsx

import './globals.css';
import KakaoMapLoader from '@/components/KakaoMapLoader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* Kakao Map 스크립트 로더를 최상위에 위치시킵니다. */}
        <KakaoMapLoader>
          {children}
        </KakaoMapLoader>
      </body>
    </html>
  );
}
3. components/KakaoMapLoader.tsx
TypeScript

// components/KakaoMapLoader.tsx

import Script from 'next/script';
import { ReactNode } from 'react';

// 클라이언트에서 사용 가능한 환경 변수
const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

interface KakaoMapLoaderProps {
  children: ReactNode;
}

export default function KakaoMapLoader({ children }: KakaoMapLoaderProps) {
  if (!KAKAO_MAP_KEY) {
    return <div>카카오 맵 API 키가 설정되지 않았습니다.</div>;
  }
  
  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`}
        strategy="beforeInteractive"
        onLoad={() => {
          // 스크립트 로드 완료 후 지도 초기화를 준비합니다.
          window.kakao.maps.load(() => {
            console.log("Kakao Map 스크립트 로드 완료.");
          });
        }}
      />
      {children}
    </>
  );
}
4. app/page.tsx
TypeScript

// app/page.tsx

import EmergencyMap from './MapComponent';

// 서버 컴포넌트 (기본값)
export default function HomePage() {
  return (
    <main style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f4f7f9' }}>
      
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#0070f3', fontSize: '2.5rem', marginBottom: '10px' }}>
          🏥 응급 의료 지역별 위험 지수 시각화
        </h1>
        <p style={{ color: '#555' }}>
          기하 분포(Geometric Distribution) 기반의 실시간 응급 의료기관 수용 위험 지수를 제공합니다.
        </p>
      </header>
      
      <section style={{ border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden' }}>
        {/* 클라이언트 컴포넌트 로드 */}
        <EmergencyMap />
      </section>

      <footer style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              * 위험 지수 계산: 세 번째 시도 이내에 수용 가능한 병원을 찾지 못할 확률 $\text{P}(\text{X} > 3)$
          </p>
      </footer>
    </main>
  );
}
주의: app/MapComponent.tsx와 data/RegionBoundary.ts는 이미 안내된 핵심 로직을 포함하고 있으므로, 위의 네 파일 외에 누락된 부분이 있다면 이전 답변을 참고하여 해당 파일들을 마저 완성해 주시면 됩니다.

궁극적으로 가장 중요한 다음 단계는 지도 시각화를 완성하기 위한 data/RegionBoundary.ts 파일에 들어갈 시군구 경계 데이터를 확보하는 것입니다.

## ✨ Next.js 응급 의료 위험 지수 웹서비스 구현 초정밀 명세서 (Vercel 최적화)

제시된 프로젝트 목표를 달성하기 위한 각 단계별 상세 로직, 코드 구조, 그리고 Vercel 환경 고려 사항을 포함하여 가장 세부적이고 생생한 명세서를 제공합니다.

---

### I. 🚀 1단계: 프로젝트 초기화 및 환경 구축

| 구분 | 파일/액션 | 상세 내용 |
| --- | --- | --- |
| **1.1 프로젝트 설정** | Terminal | Next.js 프로젝트 생성 및 TypeScript 설정: `npx create-next-app@latest emergency-risk-service --ts --app` |
| **1.2 필수 라이브러리** | Terminal | **API 통신:** `axios`, **XML 파싱:** `fast-xml-parser`, **DB ORM:** `prisma`, **지도:** `react-kakao-maps-sdk` 설치 |
| **1.3 환경 변수** | `.env`, `.env.local` | `.env` (서버/DB용): `DATABASE_URL`, `NMC_API_KEY` (URL 인코딩된 키). `.env.local` (클라이언트용): `NEXT_PUBLIC_KAKAO_MAP_KEY` |
| **1.4 Vercel 설정** | `vercel.json` | 2단계에서 구현할 `/api/data-sync`를 주기적으로 실행하도록 Cron Job 설정. (예: 매 5분마다 실행) |
| **1.5 DB 모델링** | `prisma/schema.prisma` | `EmergencyCenter` 모델 정의. 모든 Open API 필드(`hpid`, `stage1`, `stage2`, `hvec`, `hvgc`, `hvamyn` 등)를 정확한 타입(Int/String)으로 매핑. |
| **1.6 DB 연결 최적화** | `lib/prisma.ts` | **Vercel Serverless Function**의 한계를 극복하기 위해 **Prisma Singleton** 패턴 구현. 모든 API Route에서 이 파일을 import하여 DB에 접근해야 함. |

### II. 💾 2단계: 데이터 수집 (NMC Open API -> PostgreSQL)

이 단계는 **데이터의 신선도**를 유지하며 위험 지수 계산의 기반을 마련합니다.

| 구분 | 파일 | 상세 로직 |
| --- | --- | --- |
| **2.1 데이터 수집 API** | `app/api/data-sync/route.ts` | **[GET]** 요청 처리. `TARGET_REGIONS` 배열을 순회하며 Open API를 호출 (트래픽 관리). |
| **2.2 XML 파싱** | `fast-xml-parser` | Open API의 XML 응답을 파싱하여 JavaScript 객체로 변환. 이때, 문자열로 오는 `hvec` (응급실 병상), `hvgc` (입원실 병상) 등의 값은 `parseInt()`를 사용하여 **반드시 숫자(Int)로 변환**해야 DB 모델과 일치함. |
| **2.3 데이터 저장/갱신** | Prisma Upsert | `hpid`를 고유 식별자로 사용하여 `prisma.emergencyCenter.upsert()` 실행. 데이터가 이미 DB에 있으면 실시간 병상 정보만 **업데이트**하고, 없으면 새로 **생성**하여 데이터 트래픽을 최소화. |
| **2.4 에러 처리** | Try-Catch | API 호출 실패, XML 파싱 오류, DB 연결 오류 발생 시 로깅 및 500 응답 처리. |

### III. 🧠 3단계: 통계적 위험 지수 계산

이 단계는 프로젝트의 **핵심 통계 로직**을 구현하며, 클라이언트의 요청마다 실시간으로 위험 지수를 계산합니다.

| 구분 | 파일 | 상세 로직 |
| --- | --- | --- |
| **3.1 위험 지수 API** | `app/api/risk-index/route.ts` | **[GET]** 요청 처리. `stage1`, `stage2` (시도/시군구) 파라미터를 받음. |
| **3.2 DB 데이터 조회** | `prisma.findMany` | 요청된 지역의 모든 응급의료기관 정보를 DB에서 조회. |
| **3.3 성공 여부 판단** | Filter/Reduce | 조회된 기관 리스트를 순회하며 **수용 성공 조건** ( `hvec > 0` AND `hvgc > 0` AND `hvamyn == 'Y'` )을 만족하는 기관 수 ()를 카운트. 전체 기관 수 () 확보. |
| **3.4 성공 확률  계산** | TS |  계산. (일 경우 으로 처리, 위험 지수 1.0 반환) |
| **3.5 기하 분포 적용** | TS | 계산된  값을 사용하여 **위험 지수 ()** 산출. |

```
* $P(X \le 3) = p + (1-p)p + (1-p)^2 p$ 계산.
* $\text{Risk} = 1 - P(X \le 3)$ 계산 후 소수점 4자리까지 반올림. |

```

| **3.6 응답 반환** | JSON | `stage1`, `stage2`, `p`, , , 그리고 최종 `risk_index`를 클라이언트에게 반환. |

### IV. 🗺️ 4단계: 지도 시각화 및 프론트엔드 통합

이 단계는 사용자에게 통계적 정보를 **직관적으로 전달**하는 UI/UX를 구현합니다.

| 구분 | 파일 | 상세 로직 |
| --- | --- | --- |
| **4.1 지도 스크립트 로드** | `components/KakaoMapLoader.tsx` | `next/script`를 사용하여 Kakao Map SDK의 비동기 로드 관리. |
| **4.2 메인 컴포넌트** | `app/MapComponent.tsx` | `'use client'` 선언 필수. 지도 (`<Map>`)를 초기화하고 초기 위치 설정. |
| **4.3 위험도 데이터 로드** | `useEffect` (axios) | `MapComponent.tsx` 마운트 시, 전국 주요 지역의 `risk-index` API를 순회하며 호출하여 `riskData` 상태에 저장. |
| **4.4 경계 데이터 통합** | `data/RegionBoundary.ts` | **GeoJSON 데이터를 가공**하여 `path: {lat, lng}[]` 배열 형태로 준비하고 `MapComponent.tsx`에서 Import. |
| **4.5 Polygon 렌더링** | `MapComponent.tsx` | `RegionBoundaryData`를 순회하며 `<Polygon>` 컴포넌트 렌더링. |
| **4.6 색상 매핑** | `getRiskColor(riskIndex)` | Polygon의 `fillColor`를 위험 지수 값에 따라 **색상 그라데이션** (예: 0.2 이하는 녹색, 0.8 이상은 짙은 빨간색)을 적용하도록 구현. |
| **4.7 사용자 피드백** | Polygon `onClick` | 사용자가 지역 경계를 클릭하면, 해당 지역의 상세 데이터 (, , , 위험 지수)를 지도 위에 **CustomOverlay** 또는 별도의 대시보드 컴포넌트를 통해 표시. |

### V. 🚀 5단계: 배포 및 QA (Vercel)

| 구분 | 파일/액션 | 상세 내용 |
| --- | --- | --- |
| **5.1 코드 푸시** | Git | 모든 변경사항(특히 `.env`와 `.env.local`을 제외한)을 Git 저장소에 커밋 및 푸시. |
| **5.2 Vercel 배포** | Vercel | Vercel이 Git 리포지토리를 감지하여 자동 배포 시작. |
| **5.3 환경 변수 등록** | Vercel Dashboard | `DATABASE_URL`, `NMC_API_KEY` 등을 Vercel 프로젝트 환경 변수에 등록. |
| **5.4 초기 DB 갱신** | 브라우저/Cron | **배포 직후 Vercel 환경에서** `/api/data-sync` API를 수동으로 한 번 호출하여 초기 DB 데이터를 채워 넣거나, Cron Job이 실행되기를 기다림. |
| **5.5 QA 및 검증** | 브라우저 | 배포된 URL (`https://ap-statistics-project-trre.vercel.app/`)에 접속하여 지도, 통계 데이터, API의 응답 속도 등을 최종 점검. |