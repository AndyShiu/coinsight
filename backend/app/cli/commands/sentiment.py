from __future__ import annotations

import asyncio

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from app.services.sentiment_service import SentimentService

sentiment_app = typer.Typer(no_args_is_help=True)
console = Console()

SIGNAL_ICONS = {
    "bullish": "[bold green]看多 ↑[/bold green]",
    "bearish": "[bold red]看空 ↓[/bold red]",
    "neutral": "[yellow]中性 →[/yellow]",
}


def _fear_greed_color(value: int) -> str:
    """根據恐懼貪婪指數值回傳顏色"""
    if value <= 25:
        return "red"
    elif value <= 45:
        return "dark_orange"
    elif value <= 55:
        return "yellow"
    elif value <= 75:
        return "green"
    else:
        return "bold green"


@sentiment_app.command("fear")
def fear_greed(
    limit: int = typer.Option(30, "--days", "-d", help="歷史天數"),
):
    """查看恐懼貪婪指數"""

    async def _run():
        service = SentimentService()
        return await service.get_fear_greed(limit)

    result = asyncio.run(_run())

    color = _fear_greed_color(result.current_value)

    console.print(Panel(
        f"[bold {color}]{result.current_value}[/bold {color}] - "
        f"[{color}]{result.current_class}[/{color}]\n"
        f"訊號: {SIGNAL_ICONS.get(result.signal, result.signal)}  "
        f"趨勢: {result.trend}\n"
        f"7 日均值: {result.avg_7d:.1f}  |  30 日均值: {result.avg_30d:.1f}",
        title="恐懼貪婪指數",
        border_style="cyan",
    ))

    # 歷史表格 (最近 7 天)
    if not result.history.empty:
        table = Table(title="最近 7 天")
        table.add_column("日期", style="dim")
        table.add_column("數值", justify="center")
        table.add_column("分類")

        for _, row in result.history.tail(7).iterrows():
            val = int(row["value"])
            c = _fear_greed_color(val)
            date_str = str(row["timestamp"])[:10]
            table.add_row(
                date_str,
                f"[{c}]{val}[/{c}]",
                str(row["classification"]),
            )

        console.print(table)


@sentiment_app.command("funding")
def funding_rates(
    symbol: str = typer.Argument(default="BTC", help="幣種代號"),
):
    """查看資金費率"""

    async def _run():
        service = SentimentService()
        return await service.get_funding_rates(symbol)

    result = asyncio.run(_run())

    avg_pct = result.avg_rate * 100

    console.print(Panel(
        f"[bold]{result.symbol}[/bold] 資金費率\n"
        f"平均費率: {avg_pct:+.4f}%  "
        f"訊號: {SIGNAL_ICONS.get(result.signal, result.signal)}",
        title="資金費率分析",
        border_style="cyan",
    ))

    if not result.exchanges.empty:
        table = Table(title="各交易所費率")
        table.add_column("交易所", style="cyan")
        table.add_column("費率", justify="right")
        table.add_column("預估下次費率", justify="right")

        for _, row in result.exchanges.iterrows():
            rate = float(row["rate"]) * 100
            rate_color = "green" if rate < 0 else "red" if rate > 0.05 else "white"
            pred = float(row.get("predicted_rate", 0)) * 100

            table.add_row(
                str(row["exchange"]),
                f"[{rate_color}]{rate:+.4f}%[/{rate_color}]",
                f"{pred:+.4f}%",
            )

        console.print(table)
    else:
        console.print("[dim]無法取得交易所費率數據[/dim]")
