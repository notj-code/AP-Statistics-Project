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
