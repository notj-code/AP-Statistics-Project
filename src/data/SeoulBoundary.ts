// data/SeoulBoundary.ts

// This is a dummy data file for Seoul Gu boundaries.
// In a real project, this data should be obtained from a reliable source like a GeoJSON file.
export const Seoul_Gu_Boundary_Data: { name: string; path: { lat: number; lng: number }[] }[] = [
    {
        name: '강남구',
        path: [
            { lat: 37.525, lng: 127.025 },
            { lat: 37.520, lng: 127.050 },
            { lat: 37.515, lng: 127.025 },
        ],
    },
    {
        name: '송파구',
        path: [
            { lat: 37.515, lng: 127.100 },
            { lat: 37.510, lng: 127.125 },
            { lat: 37.505, lng: 127.100 },
        ],
    },
];
