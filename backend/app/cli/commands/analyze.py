from __future__ import annotations
import asyncio
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from app.dependencies import get_aggregator, get_technical_service

analyze_app = typer.Typer(no_args_is_help=True)
console = Console()

SIGNAL_ICONS = {
    "bullish": "[bold green]看多 ↑[/bold green]",
    "bearish": "[bold red]看空 ↓[/bold red]",
    "neutral": "[yellow]中性 →[/yellow]",
}


async def _cleanup():
    aggregator = get_aggregator()
    for p in aggregator._providers.values():
        if hasattr(p, "close"):
            await p.close()


@analyze_app.command("run")
def run_analysis(
    symbol: str = typer.Argument(help="幣種代號，例如 BTC"),
    timeframe: str = typer.Option("1d", "--timeframe", "-t", help="時間週期: 1h, 4h, 1d, 1w"),
):
    """對指定幣種執行完整技術分析"""

    async def _run():
        service = get_technical_service()
        try:
            return await service.get_full_analysis(symbol, timeframe)
        finally:
            await _cleanup()

    result = asyncio.run(_run())

    # 標題面板
    overall = result["overall_signal"]
    score = result["overall_score"]
    score_color = "green" if score > 0 else "red" if score < 0 else "yellow"

    console.print(Panel(
        f"[bold]{symbol.upper()}/USDT[/bold]  週期: {timeframe}\n"
        f"綜合訊號: {SIGNAL_ICONS.get(overall, overall)}  "
        f"評分: [{score_color}]{score:+.2f}[/{score_color}]",
        title="技術分析",
        border_style="cyan",
    ))

    # 各指標表格
    table = Table(show_header=True)
    table.add_column("指標", style="cyan", min_width=10)
    table.add_column("訊號", min_width=12)
    table.add_column("強度", justify="right", min_width=8)
    table.add_column("關鍵數值", style="white", min_width=30)

    for ind in result["indicators"]:
        signal_icon = SIGNAL_ICONS.get(ind["signal"], ind["signal"])
        strength_bar = "█" * int(ind["strength"] * 10) + "░" * (10 - int(ind["strength"] * 10))

        # 格式化關鍵數值
        meta_parts = []
        for k, v in ind.get("metadata", {}).items():
            if isinstance(v, float):
                meta_parts.append(f"{k}={v:.2f}")
            elif not isinstance(v, (int, float)) or k in ("period", "fast", "slow"):
                continue
            else:
                meta_parts.append(f"{k}={v}")
        meta_str = ", ".join(meta_parts[:4])

        table.add_row(
            ind["name"],
            signal_icon,
            strength_bar,
            meta_str,
        )

    console.print(table)


@analyze_app.command("indicator")
def single_indicator(
    symbol: str = typer.Argument(help="幣種代號"),
    indicator: str = typer.Argument(help="指標名稱: rsi, macd, kd, ema, bbands, volume"),
    timeframe: str = typer.Option("1d", "--timeframe", "-t", help="時間週期"),
):
    """查詢單一技術指標"""

    async def _run():
        service = get_technical_service()
        try:
            return await service.get_indicator(symbol, indicator, timeframe)
        finally:
            await _cleanup()

    result = asyncio.run(_run())
    result_dict = result.to_dict()

    console.print(Panel(
        f"[bold]{symbol.upper()}/USDT[/bold] - {result_dict['name']}\n"
        f"訊號: {SIGNAL_ICONS.get(result_dict['signal'], result_dict['signal'])}  "
        f"強度: {result_dict['strength']:.2f}",
        title=f"{result_dict['name']} 分析",
        border_style="cyan",
    ))

    # 詳細數值
    table = Table(show_header=True, title="詳細數值")
    table.add_column("參數", style="cyan")
    table.add_column("數值", style="green", justify="right")

    for k, v in result_dict.get("metadata", {}).items():
        if isinstance(v, float):
            table.add_row(k, f"{v:.4f}")
        else:
            table.add_row(k, str(v))

    console.print(table)
