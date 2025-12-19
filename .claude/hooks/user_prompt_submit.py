#!/usr/bin/env python3
"""UserPromptSubmit Hook: Brain自動コンテキスト注入"""

import os
import sys
from pathlib import Path


def _configure_pycache_prefix() -> None:
    dev_tools_path = os.environ.get("DEV_TOOLS_PATH", "~/pj/my/dev-tools")
    sys.pycache_prefix = str(Path(dev_tools_path).expanduser() / ".cache" / "pycache")


_configure_pycache_prefix()

import json
from brain_client import search_and_get


def main():
    try:
        data = json.load(sys.stdin)
        knowledge = search_and_get(data.get("prompt", ""))

        if knowledge:
            print(f"""[自動取得: Brain MCP Server]
Hooksにより現在の会話をクエリとして、過去のナレッジが自動検索されました。
必要に応じて参考にしてください（必須ではありません）。
---
{knowledge}
---""")
    except Exception:
        pass


if __name__ == "__main__":
    main()
