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
