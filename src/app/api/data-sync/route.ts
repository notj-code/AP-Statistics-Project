// app/api/data-sync/route.ts

import prisma from '@/lib/prisma';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Open API 정보
const API_KEY = process.env.NMC_API_KEY;
const BASE_URL = 'http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire';



// 실제 사용 가능한 시도/시군구 리스트를 포함하는 객체 (예시)
// 실제 프로젝트에서는 모든 시도/시군구 리스트를 확보해야 합니다.
const TARGET_REGIONS = [
    { stage1: '서울특별시', stage2: '강남구' },
    { stage1: '서울특별시', stage2: '송파구' },
    // ... 전국 시도/시군구 목록 추가
];

// Open API의 XML 데이터를 파싱하고 DB 스키마에 맞게 변환하는 함수
const parseAndTransform = (item: any) => ({
    id: item.hpid,
    dutyName: item.dutyname || '정보 없음',
    dutytel3: item.dutytel3 || '정보 없음',
    stage1: item.stage1 || '정보 없음',
    stage2: item.stage2 || '정보 없음',
    // 숫자 타입으로 변환하며, null이나 없는 값은 0으로 처리
    hvec: parseInt(item.hvec) || 0,
    hvgc: parseInt(item.hvgc) || 0,
    hvamyn: item.hvamyn || 'N',
});


export async function GET(request: Request) {
    if (!API_KEY) {
        return Response.json({ message: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    try {
        let totalCount = 0;
        let upsertCount = 0;

        // 모든 대상 지역을 순회하며 API 호출
        for (const region of TARGET_REGIONS) {
            const response = await axios.get(BASE_URL, {
                params: {
                    serviceKey: API_KEY,
                    STAGE1: region.stage1,
                    STAGE2: region.stage2,
                    numOfRows: 100 // 한 번 호출로 해당 지역 모든 병원 정보 획득 시도
                }
            });

            // XML 파싱
            const parser = new XMLParser();
            const jsonResponse = parser.parse(response.data);
            const items = jsonResponse.response?.body?.items?.item;
            
            if (!items) continue;

            const hospitalList = Array.isArray(items) ? items : [items];
            totalCount += hospitalList.length;

            // DB에 데이터 저장/갱신 (Upsert)
            for (const item of hospitalList) {
                const data = parseAndTransform(item);
                
                // hpid(id)를 기준으로 데이터가 있으면 업데이트, 없으면 생성 (Upsert)
                await prisma.emergencyCenter.upsert({
                    where: { id: data.id },
                    update: data,
                    create: data,
                });
                upsertCount++;
            }
        }
        
        return Response.json({ 
            message: `데이터 수집 및 갱신 완료. 총 ${totalCount}개 기관 중 ${upsertCount}개 항목 처리됨.`,
            status: 200
        });

    } catch (error) {
        console.error('Data Sync Error:', error);
        return Response.json({ error: "데이터 수집 중 오류 발생", details: error }, { status: 500 });
    }
}