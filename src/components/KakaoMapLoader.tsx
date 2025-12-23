'use client';

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
