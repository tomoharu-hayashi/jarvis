#!/usr/bin/env python3
"""
PreToolUse Hook: ツール実行前の検証

- git commit: 確認ダイアログ表示
- 危険コマンド: ブロック
"""

import json
import re
import subprocess
import sys


def parse_git_commit(command: str) -> dict | None:
    """git commitコマンドを解析"""
    if not command.strip().startswith("git commit"):
        return None

    params = {"message": "", "is_amend": "--amend" in command}

    # heredoc形式
    heredoc = re.search(r"<<'EOF'\s*\n(.*?)\nEOF", command, re.DOTALL)
    if heredoc:
        params["message"] = heredoc.group(1).strip()
        return params

    # -m形式
    matches = re.findall(r'(?:-m|--message)\s+["\']([^"\']+)["\']', command)
    if matches:
        params["message"] = "\n\n".join(matches)

    return params


def get_staged_info() -> tuple[list[str], str]:
    """ステージされたファイル情報を取得"""
    try:
        files_result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        files = [f for f in files_result.stdout.strip().split("\n") if f]

        stats_result = subprocess.run(
            ["git", "diff", "--cached", "--stat"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        lines = stats_result.stdout.strip().split("\n")
        stats = lines[-1] if lines else ""

        return files, stats
    except Exception:
        return [], ""


def main():
    data = json.load(sys.stdin)
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    # Bash以外はスルー
    if tool_name != "Bash":
        sys.exit(0)

    command = tool_input.get("command", "")

    # git commit確認
    commit_info = parse_git_commit(command)
    if commit_info:
        files, stats = get_staged_info()

        title = "💾 Amend?" if commit_info["is_amend"] else "💾 Commit?"
        msg = f"{title}\n\n"

        if commit_info["message"]:
            msg += f"Message:\n{commit_info['message']}\n\n"

        msg += f"Files ({len(files)}):\n"
        msg += "\n".join(f"  - {f}" for f in files[:10])
        if len(files) > 10:
            msg += f"\n  ... +{len(files) - 10} more"
        msg += f"\n\n{stats}"

        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "ask",
                "permissionDecisionReason": msg,
            }
        }
        print(json.dumps(output))
        sys.exit(0)

    # 通常のコマンドはそのまま実行
    sys.exit(0)


if __name__ == "__main__":
    main()

