// app/api/risk-index/route.ts

import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';



// 수용 성공 조건 검사 함수 (2단계의 조건을 재사용)
const checkSuccessCondition = (hvec: number, hvgc: number, hvamyn: string): boolean => {
    return hvec > 0 && hvgc > 0 && hvamyn === 'Y';
};

/**
 * Geometric Distribution 기반으로 위험 지수(P(X > 3))를 계산하는 함수
 * @param p 지역별 성공 확률
 * @returns 위험 지수 (소수점 4자리)
 */
const calculateRiskIndex = (p: number): number => {
    if (p < 0 || p > 1) return 1; // p가 유효하지 않으면 최고 위험으로 처리

    // 기하 분포 PMF: P(X = x) = (1 - p)^(x-1) * p
    
    // 1. 세 번째 시도 이내 성공 확률 P(X <= 3)
    const p_x1 = p;                                 // P(X=1)
    const p_x2 = (1 - p) * p;                       // P(X=2)
    const p_x3 = Math.pow((1 - p), 2) * p;          // P(X=3)
    
    const p_success_within_3 = p_x1 + p_x2 + p_x3;

    // 2. 위험 지수 = P(X > 3) = 1 - P(X <= 3)
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

    try {
        // 1. DB에서 해당 지역의 모든 응급의료기관 정보 조회
        const centers = await prisma.emergencyCenter.findMany({
            where: {
                stage1: stage1,
                stage2: stage2,
            },
            select: {
                hvec: true,
                hvgc: true,
                hvamyn: true,
            }
        });
        
        const totalCenters = centers.length; // n: 전체 응급의료기관 수

        if (totalCenters === 0) {
             return Response.json({ 
                stage1, 
                stage2, 
                p: 0, 
                k: 0, 
                n: 0, 
                risk_index: 1.0, // 병원이 없으면 최고 위험으로 간주
                message: '해당 지역에 등록된 응급의료기관이 없습니다.' 
            });
        }

        // 2. 수용 조건을 만족하는 기관 수 (k) 계산
        const successfulCenters = centers.filter(center => 
            checkSuccessCondition(center.hvec, center.hvgc, center.hvamyn)
        ).length;

        // 3. 성공 확률 p = k / n 계산
        const probabilityP = successfulCenters / totalCenters;
        
        // 4. 위험 지수 계산
        const riskIndex = calculateRiskIndex(probabilityP);
        
        return Response.json({
            stage1,
            stage2,
            p: parseFloat(probabilityP.toFixed(4)),
            k: successfulCenters,
            n: totalCenters,
            risk_index: riskIndex
        });

    } catch (error) {
        console.error('Risk Index Calculation Error:', error);
        return Response.json({ error: '위험 지수 계산 중 오류가 발생했습니다.' }, { status: 500 });
    } 
}