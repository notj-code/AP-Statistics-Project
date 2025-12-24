// app/api/risk-index/route.ts

import { NextRequest } from 'next/server';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Open API 정보 (환경 변수에서 가져옴)
const API_KEY = process.env.NMC_API_KEY;
const BASE_URL = 'http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire';

// 수용 성공 조건 검사 함수
const checkSuccessCondition = (item: any): boolean => {
    const isHvecAvailable = parseInt(item.hvec, 10) > 0;
    const isHvgcAvailable = parseInt(item.hvgc, 10) > 0;
    const isHvamynAvailable = item.hvamyn === 'Y';
    return isHvecAvailable && isHvgcAvailable && isHvamynAvailable;
};

/**
 * Geometric Distribution 기반으로 위험 지수(P(X > 3))를 계산하는 함수
 * @param p 지역별 성공 확률
 * @returns 위험 지수 (소수점 4자리)
 */
const calculateRiskIndex = (p: number): number => {
    if (p < 0 || p > 1) return 1;

    const p_x1 = p;
    const p_x2 = (1 - p) * p;
    const p_x3 = Math.pow((1 - p), 2) * p;
    
    const p_success_within_3 = p_x1 + p_x2 + p_x3;
    const risk_index = 1 - p_success_within_3;
    
    return parseFloat(risk_index.toFixed(4));
};


export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const stage1 = searchParams.get('stage1');
    const stage2 = searchParams.get('stage2');

    if (!stage1 || !stage2) {
        return Response.json({ error: 'STAGE1(시도) 및 STAGE2(시군구)는 필수입니다.' }, { status: 400 });
    }

    if (!API_KEY) {
        return Response.json({ message: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    let response;
    try {
        // 1. Open API 호출
        response = await axios.get(BASE_URL, {
            params: {
                serviceKey: API_KEY,
                STAGE1: stage1,
                STAGE2: stage2,
                numOfRows: 100 // 충분한 조회 건수 확보
            }
        });
    } catch (apiError) {
        console.error('External API Error:', apiError);
        return Response.json({ error: '외부 API 호출 중 오류가 발생했습니다.', details: apiError }, { status: 502 }); // 502 Bad Gateway
    }

    let jsonResponse;
    try {
        // 2. XML 응답 파싱
        const parser = new XMLParser({ 
            ignoreAttributes: false,
            tagValueProcessor: (tagName, jValue, jPath, isAttr) => {
                if(jValue === 'null' || jValue === 'N/A') return null;
                return jValue;
            }
        });
        jsonResponse = parser.parse(response.data);
    } catch (parseError) {
        console.error('XML Parsing Error:', parseError);
        return Response.json({ error: 'XML 데이터 파싱 중 오류가 발생했습니다.', details: parseError }, { status: 500 });
    }

    try {
        // 3. 핵심 데이터 추출 및 성공/실패 카운트
        let totalHospitals = 0;
        let successfulHospitals = 0;

        const items = jsonResponse.response?.body?.items?.item;
        
        const hospitalList = Array.isArray(items) ? items : (items ? [items] : []);

        if (hospitalList.length === 0) {
            return Response.json({ 
                stage1, 
                stage2, 
                p: 0, 
                k: 0, 
                n: 0, 
                risk_index: 1.0,
                message: '해당 지역에 조회된 응급의료기관이 없습니다.' 
            });
        }

        totalHospitals = hospitalList.length;

        hospitalList.forEach((item: any) => {
            if (checkSuccessCondition(item)) {
                successfulHospitals++;
            }
        });

        // 4. 성공 확률 p 계산
        const probabilityP = totalHospitals > 0 
            ? successfulHospitals / totalHospitals 
            : 0;

        // 5. 위험 지수 계산
        const riskIndex = calculateRiskIndex(probabilityP);
        
        return Response.json({
            stage1,
            stage2,
            p: parseFloat(probabilityP.toFixed(4)),
            k: successfulHospitals,
            n: totalHospitals,
            risk_index: riskIndex
        });

    } catch (processingError) {
        console.error('Data Processing Error:', processingError);
        return Response.json({ error: '데이터 처리 중 오류가 발생했습니다.', details: processingError }, { status: 500 });
    }
}
