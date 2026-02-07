from __future__ import annotations
import asyncio

import typer
from rich.console import Console
from rich.table import Table

from app.dependencies import get_aggregator, get_market_service

market_app = typer.Typer(no_args_is_help=True)
console = Console()


@market_app.command("price")
def get_price(
    symbols: str = typer.Argument(help="幣種代號（逗號分隔），例如 BTC,ETH,SOL"),
):
    """查詢即時價格"""

    async def _run():
        service = get_market_service()
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        try:
            prices = await service.get_prices(symbol_list)
        finally:
            # 關閉 ccxt exchange 連線
            aggregator = get_aggregator()
            for p in aggregator._providers.values():
                if hasattr(p, "close"):
                    await p.close()
        return prices

    prices = asyncio.run(_run())

    table = Table(title="即時價格")
    table.add_column("幣種", style="cyan", justify="center")
    table.add_column("價格 (USD)", style="green", justify="right")

    for symbol, price in prices.items():
        table.add_row(symbol, f"${price:,.2f}")

    console.print(table)


@market_app.command("top")
def market_top(
    limit: int = typer.Option(20, "--limit", "-n", help="顯示數量"),
):
    """市值排行榜"""

    async def _run():
        service = get_market_service()
        try:
            df = await service.get_market_overview(limit)
        finally:
            aggregator = get_aggregator()
            for p in aggregator._providers.values():
                if hasattr(p, "close"):
                    await p.close()
        return df

    df = asyncio.run(_run())

    table = Table(title=f"市值排行 Top {limit}")
    table.add_column("#", style="dim", justify="right")
    table.add_column("幣種", style="cyan")
    table.add_column("名稱", style="white")
    table.add_column("價格 (USD)", style="green", justify="right")
    table.add_column("24h 漲跌", justify="right")
    table.add_column("24h 成交量", style="yellow", justify="right")

    for i, row in df.iterrows():
        change = row.get("change_24h", 0) or 0
        change_style = "green" if change >= 0 else "red"
        change_str = f"[{change_style}]{change:+.2f}%[/{change_style}]"

        volume = row.get("volume_24h", 0) or 0
        if volume >= 1_000_000_000:
            vol_str = f"${volume / 1_000_000_000:.1f}B"
        elif volume >= 1_000_000:
            vol_str = f"${volume / 1_000_000:.1f}M"
        else:
            vol_str = f"${volume:,.0f}"

        table.add_row(
            str(i + 1),
            row["symbol"],
            row.get("name", ""),
            f"${row['price']:,.2f}",
            change_str,
            vol_str,
        )

    console.print(table)
