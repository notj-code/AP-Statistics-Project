# 필요한 라이브러리 설치 (처음 한 번만)
# pip install geopandas pandas matplotlib
import matplotlib.pyplot as plt
from matplotlib import font_manager, rc

# 윈도우 기본 한글 폰트
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc("font", family=font)

plt.rcParams["axes.unicode_minus"] = False

import geopandas as gpd
import pandas as pd
import matplotlib.pyplot as plt

# 1. 한국 시도 지도 불러오기 (GeoJSON)
# 행정안전부 시도 경계 GeoJSON 파일 사용 권장
# 예: https://github.com/southkorea/southkorea-maps
map_path = "skorea-geo.json"  # 같은 폴더에 두기
korea_map = gpd.read_file(map_path)

# 2. 지역별 지수 데이터 (예시 데이터)
# 실제로는 OpenAPI에서 계산한 p 값으로 교체

data = {
    "region": ["서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
               "대전광역시", "울산광역시", "경기도", "강원도", "충청북도",
               "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도"],
    "CT_Index": [0.92, 0.81, 0.78, 0.85, 0.74, 0.80, 0.76, 0.88, 0.63, 0.69,
                  0.71, 0.66, 0.60, 0.68, 0.73, 0.70]
}

df = pd.DataFrame(data)

# 3. 지도 데이터와 병합
korea_map = korea_map.merge(df, left_on="name", right_on="region", how="left")

# 4. 지도 시각화
fig, ax = plt.subplots(1, 1, figsize=(8, 10))

korea_map.plot(
    column="CT_Index",
    cmap="Blues",
    linewidth=0.8,
    edgecolor="gray",
    legend=True,
    ax=ax
)

# 5. 지역별 수치 표시
for idx, row in korea_map.iterrows():
    if row.geometry is not None and pd.notnull(row.CT_Index):
        x, y = row.geometry.centroid.coords[0]
        ax.text(x, y, f"{row.CT_Index:.2f}", ha='center', va='center', fontsize=8)

# 6. 제목 및 스타일
ax.set_title("지역별 CT 접근 지수 (p)", fontsize=14)
ax.axis("off")

plt.show()
