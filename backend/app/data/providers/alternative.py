from __future__ import annotations

import httpx
import pandas as pd

from app.data.base import SentimentDataProvider

ALTERNATIVE_ME_URL = "https://api.alternative.me/fng/"


class AlternativeMeProvider(SentimentDataProvider):
    """Alternative.me 恐懼貪婪指數 (完全免費、無需 API key)"""

    async def get_fear_greed_index(self, limit: int = 30) -> pd.DataFrame:
        """取得恐懼貪婪指數歷史數據

        回傳 DataFrame 欄位: timestamp, value, classification
        value: 0 (極度恐懼) ~ 100 (極度貪婪)
        classification: Extreme Fear / Fear / Neutral / Greed / Extreme Greed
        """
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                ALTERNATIVE_ME_URL,
                params={"limit": str(limit), "format": "json"},
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()

        rows = []
        for entry in data.get("data", []):
            rows.append({
                "timestamp": pd.to_datetime(int(entry["timestamp"]), unit="s", utc=True),
                "value": int(entry["value"]),
                "classification": entry["value_classification"],
            })

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values("timestamp").reset_index(drop=True)
        return df
