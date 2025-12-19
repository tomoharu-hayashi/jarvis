#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path


def main() -> int:
    root_dir = Path(__file__).resolve().parent.parent
    tmp_dir = Path(os.environ.get("TMP_DIR", root_dir / ".tmp"))
    stop_file = Path(os.environ.get("STOP_FILE", tmp_dir / "stop"))

    max_iters = int(os.environ.get("MAX_ITERS", "1000000"))
    sleep_sec = float(os.environ.get("SLEEP_SEC", "1"))

    tmp_dir.mkdir(parents=True, exist_ok=True)

    print("start: infinite")
    print(f"- provider: {os.environ.get('PROVIDER', 'cursor')}")
    print(f"- max iters: {max_iters}")
    print(f"- sleep sec: {sleep_sec}")
    print(f"- stop file: {stop_file}")

    fails = 0
    last_code = 0

    auto_path = root_dir / "scripts" / "auto.py"

    for i in range(1, max_iters + 1):
        if stop_file.exists():
            print(f"stop: file found ({stop_file})")
            return 0

        print(f"---- iter {i} ----")

        p = subprocess.run(
            [sys.executable, str(auto_path), *sys.argv[1:]],
            cwd=str(root_dir),
            check=False,
        )
        code = int(p.returncode)

        if code != 0:
            if code == last_code:
                fails += 1
            else:
                fails = 1
                last_code = code

            print(f"warn: auto failed (code={code}, consecutive={fails})")
            if fails >= 3:
                print(f"stop: same failure 3 times (code={code})")
                return code
        else:
            fails = 0
            last_code = 0

        time.sleep(sleep_sec)

    print(f"stop: reached MAX_ITERS={max_iters}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
