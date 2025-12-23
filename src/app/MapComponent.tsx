// app/MapComponent.tsx

'use client'; 

import React, { useState, useEffect } from 'react';
import { Map, MapMarker, CustomOverlay, Polygon } from 'react-kakao-maps-sdk';
import axios from 'axios';

// 지역 경계선 데이터는 별도로 준비해야 합니다. 
// 예: GeoJSON 형태의 시군구 경계 데이터 (실제 프로젝트에서 필요)
import { Seoul_Gu_Boundary_Data } from '../data/SeoulBoundary'; // 가상의 경계선 데이터 파일

// 위험 지수 범위에 따른 색상 정의 (위험할수록 붉은색)
const getRiskColor = (riskIndex: number) => {
    if (riskIndex >= 0.7) return 'rgba(255, 0, 0, 0.6)';      // 매우 높음 (빨강)
    if (riskIndex >= 0.5) return 'rgba(255, 165, 0, 0.6)';    // 높음 (주황)
    if (riskIndex >= 0.3) return 'rgba(255, 255, 0, 0.6)';    // 보통 (노랑)
    return 'rgba(0, 128, 0, 0.6)';                            // 낮음 (녹색)
};

interface RiskData {
    stage1: string;
    stage2: string;
    risk_index: number;
    p: number;
}

export default function EmergencyMap() {
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울시청 기준
    const [riskData, setRiskData] = useState<RiskData[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<RiskData | null>(null);

    // 1. 모든 시군구의 위험 지수 데이터를 API에서 가져오는 함수
    useEffect(() => {
        // 실제 프로젝트에서는 모든 지역을 순회하며 API 호출 로직이 필요합니다.
        // 여기서는 서울시 강남구, 송파구에 대한 예시 데이터를 호출합니다.
        const fetchRiskData = async () => {
            try {
                // (주의: 실제로는 모든 지역을 순회하며 호출해야 함)
                const gangnam = await axios.get('/api/risk-index?stage1=서울특별시&stage2=강남구');
                const songpa = await axios.get('/api/risk-index?stage1=서울특별시&stage2=송파구');
                
                setRiskData([
                    gangnam.data as RiskData,
                    songpa.data as RiskData,
                    // ... 다른 지역 데이터 추가
                ]);
            } catch (error) {
                console.error("위험 지수 데이터 로드 실패:", error);
            }
        };

        fetchRiskData();
    }, []);

    // 2. 지역 경계를 클릭했을 때 실행될 핸들러
    const handlePolygonClick = (data: RiskData) => {
        setSelectedRegion(data);
        // 지도를 해당 지역 중심으로 이동 (Optional)
        // setMapCenter({ lat: data.lat, lng: data.lng }); 
    };

    return (
        <div style={{ width: '100%', height: '80vh', position: 'relative' }}>
            <Map 
                center={mapCenter}
                style={{ width: '100%', height: '100%' }}
                level={9} // 지도 확대/축소 레벨
                isPanto={true} // 부드러운 지도 이동
            >
                {/* 3. 지역별 위험 지수 시각화 (Polygon 사용) */}
                {Seoul_Gu_Boundary_Data.map((boundary, index) => {
                    // 데이터에서 해당 지역의 위험 지수 찾기
                    const currentRisk = riskData.find(d => d.stage2 === boundary.name);
                    const riskIndex = currentRisk ? currentRisk.risk_index : 0.5; // 데이터 없으면 기본값

                    return (
                        <Polygon
                            key={index}
                            path={boundary.path} // 시군구 경계 좌표 배열
                            strokeWeight={2}
                            strokeColor="#000000"
                            strokeOpacity={0.8}
                            fillColor={getRiskColor(riskIndex)} // 위험도에 따른 색상 적용
                            fillOpacity={0.6}
                            onClick={() => currentRisk && handlePolygonClick(currentRisk)} // 클릭 이벤트 처리
                        />
                    );
                })}

            </Map>
            
            {/* 4. 선택된 지역의 위험 지수 정보 표시 (대시보드) */}
            {selectedRegion && (
                <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <h3>📍 {selectedRegion.stage1} {selectedRegion.stage2} 위험 지수</h3>
                    <p>🔴 **위험 지수 (P(X &gt; 3)):** **{selectedRegion.risk_index}**</p>
                    <p>🟢 성공 확률 (p = k/n): {selectedRegion.p}</p>
                    <p>*(위험 지수가 1.0에 가까울수록 안전한 병원 찾기 어려움)*</p>
                    <button onClick={() => setSelectedRegion(null)}>닫기</button>
                </div>
            )}
        </div>
    );
}