from __future__ import annotations

import asyncio

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from app.services.onchain_service import OnchainService

onchain_app = typer.Typer(no_args_is_help=True)
console = Console()

SIGNAL_ICONS = {
    "bullish": "[bold green]看多 ↑[/bold green]",
    "bearish": "[bold red]看空 ↓[/bold red]",
    "neutral": "[yellow]中性 →[/yellow]",
}


@onchain_app.command("flow")
def exchange_flow(
    asset: str = typer.Argument(default="BTC", help="資產代號"),
):
    """查看交易所流入流出 (需 Glassnode API key)"""

    async def _run():
        service = OnchainService()
        return await service.get_exchange_flow(asset)

    result = asyncio.run(_run())

    if result.latest_netflow == 0 and result.history.empty:
        console.print(Panel(
            "[yellow]需要 Glassnode API key 才能使用此功能[/yellow]\n"
            "請在 .env 設定 CRYPTO_GLASSNODE_API_KEY",
            title="交易所流入流出",
            border_style="red",
        ))
        return

    trend_icon = {"accumulation": "囤幣", "distribution": "拋售", "neutral": "中性"}

    console.print(Panel(
        f"[bold]{asset.upper()}[/bold] 交易所流入流出\n"
        f"最新淨流量: {result.latest_netflow:+,.2f}\n"
        f"7 日平均: {result.avg_netflow_7d:+,.2f}\n"
        f"趨勢: {trend_icon.get(result.trend, result.trend)}\n"
        f"訊號: {SIGNAL_ICONS.get(result.signal, result.signal)}",
        title="交易所流入流出分析",
        border_style="cyan",
    ))


@onchain_app.command("mvrv")
def mvrv(
    asset: str = typer.Argument(default="BTC", help="資產代號"),
):
    """查看 MVRV 比率 (需 Glassnode API key)"""

    async def _run():
        service = OnchainService()
        return await service.get_mvrv(asset)

    result = asyncio.run(_run())

    if result.current_mvrv == 0 and result.history.empty:
        console.print(Panel(
            "[yellow]需要 Glassnode API key 才能使用此功能[/yellow]\n"
            "請在 .env 設定 CRYPTO_GLASSNODE_API_KEY",
            title="MVRV 分析",
            border_style="red",
        ))
        return

    zone_labels = {
        "undervalued": "[green]低估區[/green]",
        "fair": "[yellow]合理區間[/yellow]",
        "overvalued": "[red]高估區[/red]",
        "extreme": "[bold red]極度過熱[/bold red]",
    }

    console.print(Panel(
        f"[bold]{asset.upper()}[/bold] MVRV 比率\n"
        f"當前值: {result.current_mvrv:.4f}\n"
        f"區間: {zone_labels.get(result.zone, result.zone)}\n"
        f"訊號: {SIGNAL_ICONS.get(result.signal, result.signal)}",
        title="MVRV 分析",
        border_style="cyan",
    ))


@onchain_app.command("nupl")
def nupl(
    asset: str = typer.Argument(default="BTC", help="資產代號"),
):
    """查看 NUPL (需 Glassnode API key)"""

    async def _run():
        service = OnchainService()
        return await service.get_nupl(asset)

    result = asyncio.run(_run())

    if result.current_nupl == 0 and result.history.empty:
        console.print(Panel(
            "[yellow]需要 Glassnode API key 才能使用此功能[/yellow]\n"
            "請在 .env 設定 CRYPTO_GLASSNODE_API_KEY",
            title="NUPL 分析",
            border_style="red",
        ))
        return

    phase_labels = {
        "capitulation": "[bold red]投降[/bold red]",
        "hope": "[green]希望[/green]",
        "optimism": "[yellow]樂觀[/yellow]",
        "belief": "[dark_orange]信念[/dark_orange]",
        "euphoria": "[bold red]狂熱[/bold red]",
    }

    console.print(Panel(
        f"[bold]{asset.upper()}[/bold] NUPL\n"
        f"當前值: {result.current_nupl:.4f}\n"
        f"階段: {phase_labels.get(result.phase, result.phase)}\n"
        f"訊號: {SIGNAL_ICONS.get(result.signal, result.signal)}",
        title="NUPL 分析",
        border_style="cyan",
    ))


@onchain_app.command("network")
def btc_network():
    """查看 BTC 網路統計 (免費)"""

    async def _run():
        service = OnchainService()
        return await service.get_btc_network_stats()

    stats = asyncio.run(_run())

    if not stats:
        console.print("[red]無法取得 BTC 網路統計[/red]")
        return

    table = Table(title="BTC 網路統計")
    table.add_column("指標", style="cyan")
    table.add_column("數值", style="green", justify="right")

    for key, value in stats.items():
        if value is not None:
            if isinstance(value, float) and value > 1_000_000_000:
                display = f"{value / 1_000_000_000:.2f} G"
            elif isinstance(value, float) and value > 1_000_000:
                display = f"{value / 1_000_000:.2f} M"
            else:
                display = f"{value:,.0f}" if isinstance(value, (int, float)) else str(value)
            table.add_row(key, display)

    console.print(table)
