export interface IndicatorInfo {
  name: string;
  description: string;
  interpretation: string;
}

export const technicalIndicatorInfo: Record<string, IndicatorInfo> = {
  RSI: {
    name: "RSI (相對強弱指數)",
    description: "衡量價格變動速度與幅度的動量指標，範圍 0-100。",
    interpretation: "< 30 超賣 (買入機會) | > 70 超買 (賣出訊號)",
  },
  KD: {
    name: "KD 隨機指標",
    description: "比較收盤價與一段時間內的價格範圍，判斷超買超賣。",
    interpretation: "K < 20 超賣 | K > 80 超買 | K 上穿 D 為黃金交叉",
  },
  MACD: {
    name: "MACD (指數平滑異同移動平均線)",
    description: "用兩條 EMA 的差值判斷趨勢方向與動能變化。",
    interpretation: "MACD > Signal 看多 | MACD < Signal 看空 | 柱狀體反轉為趨勢轉換訊號",
  },
  EMA: {
    name: "EMA (指數移動平均線)",
    description: "用 EMA20 與 EMA50 的交叉判斷中期趨勢方向。",
    interpretation: "EMA20 > EMA50 上升趨勢 | EMA20 < EMA50 下降趨勢",
  },
  BBANDS: {
    name: "布林通道",
    description: "以移動平均線為中心，上下兩個標準差形成的通道，衡量波動性。",
    interpretation: "價格觸下軌為支撐 (買) | 觸上軌為壓力 (賣) | 通道收窄預示大波動",
  },
  Volume: {
    name: "成交量 + OBV",
    description: "分析成交量變化與 OBV (能量潮) 趨勢，確認價格走勢的有效性。",
    interpretation: "量增價漲看多 | 量增價跌看空 | OBV 上升代表買盤積累",
  },
};

export const sentimentInfo: Record<string, IndicatorInfo> = {
  fearGreed: {
    name: "恐懼貪婪指數",
    description: "綜合波動率、交易量、社群情緒等因素，衡量市場整體情緒，範圍 0-100。",
    interpretation: "0-25 極度恐懼 (逆向買入) | 75-100 極度貪婪 (逆向賣出) | 反向操作策略",
  },
  fundingRate: {
    name: "資金費率",
    description: "永續合約多空雙方定期支付的費率，反映市場槓桿方向。",
    interpretation: "正值 = 多頭付費 (做多擁擠) | 負值 = 空頭付費 (做空擁擠) | > 0.05% 過熱警訊",
  },
  openInterest: {
    name: "未平倉合約 (Open Interest)",
    description: "衍生品市場中所有未結算合約的總量，反映市場參與度和槓桿水平。",
    interpretation: "OI 上升 + 價格上漲 = 強勢趨勢 | OI 快速膨脹 > 15% = 過度槓桿警訊 | OI 下降 = 去槓桿",
  },
  longShortRatio: {
    name: "多空比 (Long/Short Ratio)",
    description: "頂級交易者的多空持倉帳戶比例，反映市場主力方向。逆向指標。",
    interpretation: "Ratio > 1.5 = 多頭擁擠 (逆向看空) | Ratio < 0.67 = 空頭擁擠 (逆向看多)",
  },
  takerVolume: {
    name: "主動買賣量比 (Taker Buy/Sell)",
    description: "市場中主動吃單的買賣量比例，反映即時的買賣壓力方向。順勢指標。",
    interpretation: "Ratio > 1.15 = 強烈買壓 (看多) | Ratio < 0.85 = 強烈賣壓 (看空) | 接近 1.0 = 均衡",
  },
};

export const onchainInfo: Record<string, IndicatorInfo> = {
  exchangeFlow: {
    name: "交易所流入流出",
    description: "追蹤加密貨幣進出交易所的淨流量，反映持有者行為意圖。",
    interpretation: "淨流出 = 囤幣 (看多) | 淨流入 = 準備拋售 (看空)",
  },
  mvrv: {
    name: "MVRV (市場價值/已實現價值)",
    description: "比較當前市值與鏈上持有者的平均成本，衡量整體市場盈虧狀態。",
    interpretation: "< 1.0 低估區 (買入) | 1.0-2.4 合理 | 2.4-3.7 高估 | > 3.7 泡沫警訊",
  },
  nupl: {
    name: "NUPL (淨未實現盈虧)",
    description: "衡量市場中所有持有者的未實現盈虧比例，判斷市場週期位置。",
    interpretation: "< 0 投降期 (底部) | 0-0.25 希望 | 0.25-0.5 樂觀 | 0.5-0.75 信念 | > 0.75 狂熱 (頂部)",
  },
  network: {
    name: "BTC 網路統計",
    description: "比特幣區塊鏈的基礎網路健康指標。",
    interpretation: "Hash Rate 上升 = 礦工信心增強 | 活躍地址增加 = 網路使用率提升",
  },
};

export const overallScoreInfo: IndicatorInfo = {
  name: "綜合評分",
  description:
    "每個指標輸出 -1.0 ~ +1.0 的連續分數，再按分析維度分組加權：動量 (RSI/KD/MACD) 25%、趨勢 (EMA) 20%、波動 (BB) 15%、量能 (Vol) 10%、衍生品 (OI/多空比/買賣量) 30%。連續分數使評分更精確反映指標的實際數值。",
  interpretation: "> 0.2 偏多 | < -0.2 偏空 | -0.2 ~ 0.2 中性觀望",
};

export const consensusInfo: IndicatorInfo = {
  name: "指標一致性",
  description:
    "衡量所有指標方向的一致程度。計算方式為 1 減去所有連續分數的標準差。一致性高代表多數指標指向相同方向，評分結果可信度較高。",
  interpretation: "≥ 80% 高度一致 (可信) | 50~80% 中等一致 | < 50% 分歧較大 (需謹慎)",
};

export const chartOverlayInfo: Record<string, IndicatorInfo> = {
  ema: {
    name: "EMA (指數移動平均線)",
    description: "疊加 EMA(9) 快線與 EMA(21) 慢線，用交叉判斷趨勢方向。",
    interpretation: "快線上穿慢線 = 黃金交叉 (多) | 快線下穿慢線 = 死亡交叉 (空)",
  },
  bbands: {
    name: "布林通道 (Bollinger Bands)",
    description: "中線為 20 日均線，上下軌為 ±2 標準差，衡量價格波動範圍。",
    interpretation: "觸下軌 = 支撐 (買) | 觸上軌 = 壓力 (賣) | 通道收窄 = 即將大波動",
  },
  sr: {
    name: "支撐 / 壓力位 (Pivot Points)",
    description: "以前一週期的最高、最低、收盤價計算五條關鍵水平線：PP (樞軸點)、R1/R2 (壓力位)、S1/S2 (支撐位)。",
    interpretation: "價格在 PP 上方偏多 | R1/R2 為賣壓區，到此易回落 | S1/S2 為買盤區，到此易反彈",
  },
  vpvr: {
    name: "成交量分佈 (Volume Profile)",
    description: "將可見範圍的成交量按價格分 40 區間，以水平柱狀圖顯示各價位的交易密集度。",
    interpretation: "高量區 = 強支撐/壓力 | 最長柱 = POC (控制點) | 低量區 = 價格易快速穿越",
  },
};

export const chartSubChartInfo: Record<string, IndicatorInfo> = {
  rsi: {
    name: "RSI (相對強弱指數)",
    description: "衡量價格變動速度與幅度的動量指標，範圍 0-100。",
    interpretation: "< 30 超賣 (買入機會) | > 70 超買 (賣出訊號)",
  },
  kd: {
    name: "KD 隨機指標",
    description: "比較收盤價與一段時間內的價格範圍，判斷超買超賣。",
    interpretation: "K < 20 超賣 | K > 80 超買 | K 上穿 D 為黃金交叉",
  },
  macd: {
    name: "MACD (指數平滑異同移動平均線)",
    description: "用兩條 EMA 的差值判斷趨勢方向與動能變化。",
    interpretation: "MACD > Signal 看多 | MACD < Signal 看空 | 柱狀體反轉為趨勢轉換訊號",
  },
};

export const networkStatInfo: Record<string, string> = {
  hash_rate: "全網算力，越高代表礦工投入越多，網路越安全",
  difficulty: "挖礦難度，隨算力調整，反映網路競爭程度",
  active_addresses: "24h 活躍地址數，反映網路使用熱度",
  transaction_count: "24h 鏈上交易數量",
  mempool_size: "等待確認的交易數量，越高代表網路越擁擠",
};
