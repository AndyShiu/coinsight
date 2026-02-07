# CoinSight 幣析

全端加密貨幣技術分析與市場情緒儀表板。整合多交易所行情、6 大技術指標、衍生品數據、鏈上分析，提供連續分數評分系統與指標一致性指標。

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## 功能特色

### 技術分析
- **6 大技術指標**：RSI、KD、MACD、EMA、布林通道、成交量/OBV
- **連續分數系統**：每個指標輸出 -1.0 ~ +1.0 連續分數（非離散信號），精確反映指標數值
- **分組加權評分**：動量 25%、趨勢 20%、波動 15%、量能 10%、衍生品 30%
- **指標一致性指標**：衡量多指標方向分歧程度，輔助判斷評分可信度
- **支撐/壓力位**：Pivot Points (PP/R1/R2/S1/S2) 自動計算與圖表疊加
- **9 種時間框架**：15m / 30m / 1h / 2h / 4h / 12h / 1d / 3d / 1w，分為短線、波段、中長線三類

### 市場情緒
- **恐懼貪婪指數**：Alternative.me 數據，含 30 天走勢 sparkline
- **多交易所資金費率**：Binance、OKX、Bybit、Bitget、Gate.io（全免費）
- **衍生品指標**：未平倉合約 (OI)、多空比、主動買賣量比

### 鏈上數據
- **交易所流入流出**：Glassnode 淨流量分析
- **MVRV / NUPL**：市場週期估值指標
- **BTC 網路統計**：算力、難度、活躍地址（Blockchain.com 免費）

### 前端介面
- **互動式 K 線圖**：lightweight-charts v5，支援指標疊加（EMA/BB/S/R/VPVR）與子圖（RSI/KD/MACD）
- **深淺色主題**：Canvas 動態流動背景（淺色模式）、完整主題切換
- **分享功能**：精簡摘要卡片 + 完整頁面截圖，含品牌框與浮水印
- **可編輯關注清單**：拖拽排序、搜尋新增、Dashboard 置頂
- **響應式設計**：桌面與行動裝置自適應

## 架構

```
crypto-analyze/
├── backend/                    # FastAPI + typer CLI
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST API 端點
│   │   ├── core/
│   │   │   ├── indicators/     # 技術指標引擎 (RSI, KD, MACD, EMA, BB, Vol)
│   │   │   └── sentiment/      # 情緒分析引擎 (OI, 多空比, 買賣量)
│   │   ├── data/
│   │   │   ├── providers/      # 數據提供者 (CoinGecko, Binance, Glassnode...)
│   │   │   ├── aggregator.py   # 多 provider 聚合
│   │   │   └── cache.py        # L1 InMemory + L2 SQLite 快取
│   │   ├── schemas/            # Pydantic 資料模型
│   │   ├── services/           # 業務邏輯層
│   │   └── cli/                # CLI 命令
│   └── tests/                  # 單元測試 (36 tests)
│
├── frontend/                   # Next.js 16 + TypeScript
│   └── src/
│       ├── app/                # 頁面路由
│       │   ├── page.tsx        # Dashboard（恐懼貪婪 + 快速訊號 + 市場行情）
│       │   ├── symbol/[symbol] # 幣種詳情（K 線 + 指標 + 衍生品 + 鏈上）
│       │   ├── sentiment/      # 市場情緒頁
│       │   └── settings/       # API Key 與偏好設定
│       ├── components/         # UI 元件
│       │   ├── charts/         # K 線圖、訊號儀表、指標覆蓋
│       │   ├── dashboard/      # 恐懼貪婪 banner、快速訊號卡片
│       │   ├── indicators/     # 指標卡片、信號徽章
│       │   ├── sentiment/      # 資金費率、衍生品卡片
│       │   ├── onchain/        # 鏈上數據卡片
│       │   └── share/          # 分享截圖功能
│       └── lib/
│           ├── api/            # API 客戶端
│           ├── hooks/          # React Query hooks
│           ├── stores/         # Zustand 狀態管理
│           ├── types/          # TypeScript 型別
│           └── utils/          # 工具函式
│
└── crypto_analyze.db           # SQLite 資料庫
```

## 快速開始

### 環境需求

- Python 3.9+
- Node.js 18+
- npm

### 一鍵啟動（推薦）

腳本會自動檢查環境、建立虛擬環境、安裝依賴，並啟動前後端服務。

**Mac / Linux**

```bash
chmod +x start.sh stop.sh   # 首次使用需設定執行權限
./start.sh                   # 啟動（自動檢查環境 + 安裝依賴 + 啟動服務）
./stop.sh                    # 關閉前後端
```

**Windows**

```cmd
start.bat                    :: 啟動
stop.bat                     :: 關閉
```

啟動後：
- 前端：http://localhost:3000
- 後端 API：http://localhost:8000
- API 文件：http://localhost:8000/docs

### 手動啟動

<details>
<summary>展開手動步驟</summary>

**後端**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env          # 選填，編輯填入 API key
uvicorn app.main:app --reload --port 8000
```

**前端**

```bash
cd frontend
npm install
npm run dev
```

</details>

### CLI 命令

```bash
cd backend && source .venv/bin/activate

coinsight analyze run BTC --timeframe 1d
coinsight market price BTC,ETH,SOL
coinsight sentiment fear --days 30
```

### 測試

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

## API 端點

| 類別 | 端點 | 說明 |
|------|------|------|
| 市場 | `GET /api/v1/market/prices?symbols=BTC,ETH` | 即時價格 |
| 市場 | `GET /api/v1/market/overview?limit=100` | 市值排行 |
| 市場 | `GET /api/v1/market/ohlcv/{symbol}` | K 線數據 |
| 技術 | `GET /api/v1/technical/{symbol}/analysis` | 完整技術分析 |
| 技術 | `GET /api/v1/technical/{symbol}/series/{indicator}` | 指標時間序列 |
| 技術 | `GET /api/v1/technical/{symbol}/support-resistance` | 支撐壓力位 |
| 情緒 | `GET /api/v1/sentiment/fear-greed` | 恐懼貪婪指數 |
| 情緒 | `GET /api/v1/sentiment/funding-rates?symbol=BTC` | 多交易所資金費率 |
| 情緒 | `GET /api/v1/sentiment/open-interest?symbol=BTC` | 未平倉合約 |
| 情緒 | `GET /api/v1/sentiment/long-short-ratio?symbol=BTC` | 多空比 |
| 情緒 | `GET /api/v1/sentiment/taker-volume?symbol=BTC` | 主動買賣量 |
| 鏈上 | `GET /api/v1/onchain/{asset}/exchange-flow` | 交易所流量 |
| 鏈上 | `GET /api/v1/onchain/{asset}/mvrv` | MVRV 比率 |
| 鏈上 | `GET /api/v1/onchain/btc/network` | BTC 網路統計 |
| 設定 | `GET/PUT /api/v1/settings/api-keys` | API Key 管理 |
| 設定 | `GET/PUT /api/v1/settings/watchlist` | 關注清單 |

## 評分系統

### 連續分數映射

每個指標根據原始數值計算 -1.0 ~ +1.0 的連續分數：

| 指標 | 映射方式 | 範例 |
|------|---------|------|
| RSI | 分段線性 (50→0, 30→+0.4, 70→-0.4) | RSI=31 → +0.38, RSI=85 → -0.9 |
| KD | K 值分段線性 + 黃金/死亡交叉加成 | K=15 + 黃金交叉 → +0.9 |
| MACD | tanh(histogram/price%) + 動量加成 | 柱狀體正且成長 → 更強 |
| EMA | tanh(快慢線差/慢線%) + 交叉加成 | 黃金交叉 → +0.2 加成 |
| BB | %B 分段線性 (0.5→0, 突破軌道→±1.0) | 觸下軌 → +0.5 |
| Volume | OBV 方向 × tanh(成交量比) | 量增價漲 → +0.6~0.8 |
| OI | 過度槓桿為負 / 溫和增長微正 | +20% → -0.32 |
| 多空比 | tanh 逆向 + 弱訊號區壓縮 | ratio=1.5 → -0.54 |
| 買賣量 | tanh 順勢 + 弱訊號區壓縮 | ratio=1.15 → +0.49 |

### 分組加權

```
綜合評分 = Σ(組內平均 × 群組權重)

動量 (RSI, KD, MACD)     → 25%
趨勢 (EMA)               → 20%
波動 (BB)                 → 15%
量能 (Volume/OBV)         → 10%
衍生品 (OI, 多空比, 買賣量) → 30%
```

### 一致性指標

```
consensus = 1 - std(所有連續分數)
≥ 80% → 高度一致（評分可信度高）
50~80% → 中等一致
< 50% → 分歧較大（需謹慎參考）
```

## 數據來源

| 來源 | 數據 | 費用 |
|------|------|------|
| CoinGecko | 市價、市值排行、幣種搜尋 | 免費 |
| Binance Futures | OHLCV、資金費率、OI、多空比、買賣量 | 免費 |
| OKX / Bybit / Bitget / Gate.io | 資金費率 | 免費 |
| Alternative.me | 恐懼貪婪指數 | 免費 |
| Blockchain.com | BTC 網路統計 | 免費 |
| Glassnode | MVRV、NUPL、交易所流量 | 付費 ($29+/月) |

> 大部分功能完全免費使用，無需任何 API key。Glassnode 相關的鏈上數據需要付費 key。

## 技術棧

**後端**
- FastAPI + Uvicorn (ASGI)
- SQLAlchemy + aiosqlite (非同步 SQLite)
- ccxt (交易所整合)
- ta (技術指標)
- Typer + Rich (CLI)
- Pydantic v2 (資料驗證)

**前端**
- Next.js 16 + React 19
- TypeScript 5
- Tailwind CSS v4 + shadcn/ui
- lightweight-charts v5 (K 線圖)
- Recharts (統計圖表)
- TanStack React Query (數據獲取)
- Zustand (狀態管理)
- next-themes (主題切換)

## 授權

MIT License

## 作者

**Andy Shiu** - [github.com/AndyShiu](https://github.com/AndyShiu)
