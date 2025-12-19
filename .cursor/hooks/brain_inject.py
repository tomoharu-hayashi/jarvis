#!/usr/bin/env python3
"""beforeSubmitPrompt Hook: Brain自動コンテキスト注入"""

import os
import json
import sys
from pathlib import Path


def _configure_pycache_prefix() -> None:
    dev_tools_path = os.environ.get("DEV_TOOLS_PATH", "~/pj/my/dev-tools")
    sys.pycache_prefix = str(Path(dev_tools_path).expanduser() / ".cache" / "pycache")


_configure_pycache_prefix()

sys.path.insert(0, str(Path(__file__).parent.parent.parent / ".claude" / "hooks"))
from brain_client import search_and_get


def main():
    data = json.load(sys.stdin)
    prompt = data.get("prompt", "")

    knowledge = search_and_get(prompt)

    output = {"continue": True}
    if knowledge:
        output["user_message"] = f"""[自動取得: Brain MCP Server]
Hooksにより現在の会話をクエリとして、過去のナレッジが自動検索されました。
必要に応じて参考にしてください（必須ではありません）。
---
{knowledge}
---"""
    print(json.dumps(output))


if __name__ == "__main__":
    main()
