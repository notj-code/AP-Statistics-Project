'use client';

import { Map, Polygon } from 'react-kakao-maps-sdk';
import { useEffect, useState } from 'react';

export default function EmergencyMap() {
  const [riskIndex, setRiskIndex] = useState(null);

  useEffect(() => {
    fetch('/api/risk-index')
      .then((res) => res.json())
      .then((data) => {
        setRiskIndex(data);
      });
  }, []);

  return (
    <Map
      center={{ lat: 36.5, lng: 127.5 }}
      style={{ width: '100%', height: '600px' }}
      level={11}
    >
      {/* TODO: Render Polygons based on riskIndex and RegionBoundaryData */}
    </Map>
  );
}
