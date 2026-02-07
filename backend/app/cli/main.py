from __future__ import annotations
import asyncio
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from app.cli.commands.analyze import analyze_app
from app.cli.commands.market import market_app
from app.cli.commands.onchain import onchain_app
from app.cli.commands.sentiment import sentiment_app

app = typer.Typer(
    name="coinsight",
    help="加密貨幣技術分析與市場洞察工具",
    no_args_is_help=True,
)
console = Console()

app.add_typer(analyze_app, name="analyze", help="技術分析")
app.add_typer(market_app, name="market", help="市場行情")
app.add_typer(sentiment_app, name="sentiment", help="市場情緒")
app.add_typer(onchain_app, name="onchain", help="鏈上數據")


@app.command()
def version():
    """顯示版本資訊"""
    console.print(Panel("CoinSight 幣析 v0.1.0", title="版本", border_style="cyan"))


if __name__ == "__main__":
    app()
