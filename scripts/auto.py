#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Config:
    root_dir: Path
    prompt_dir: Path
    readme_file: Path
    tmp_dir: Path
    stop_file: Path
    provider: str  # cursor | claude | codex
    dry_run: bool
    instruction: str


def _env_path(name: str, default: Path) -> Path:
    v = os.environ.get(name)
    return Path(v) if v else default


def load_config(argv: list[str]) -> Config:
    root_dir = Path(__file__).resolve().parent.parent
    prompt_dir = _env_path("PROMPT_DIR", root_dir / "prompts" / "commands")
    readme_file = _env_path("README_FILE", root_dir / "README.md")
    tmp_dir = _env_path("TMP_DIR", root_dir / ".tmp")
    stop_file = _env_path("STOP_FILE", tmp_dir / "stop")
    provider = os.environ.get("PROVIDER", "cursor").strip()
    dry_run = os.environ.get("DRY_RUN", "0").strip() == "1"
    instruction = " ".join(argv).strip()

    return Config(
        root_dir=root_dir,
        prompt_dir=prompt_dir,
        readme_file=readme_file,
        tmp_dir=tmp_dir,
        stop_file=stop_file,
        provider=provider,
        dry_run=dry_run,
        instruction=instruction,
    )


def require_file(path: Path) -> None:
    if not path.is_file():
        raise FileNotFoundError(f"missing file: {path}")


def run_cmd_capture_text(cmd: list[str], cwd: Path) -> str:
    try:
        res = subprocess.run(
            cmd,
            cwd=str(cwd),
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except FileNotFoundError:
        return ""
    return (res.stdout or "").rstrip("\n")


def git_branch(root_dir: Path) -> str:
    out = run_cmd_capture_text(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=root_dir)
    return out or "unknown"


def git_status_porcelain(root_dir: Path) -> str:
    return run_cmd_capture_text(["git", "status", "--porcelain"], cwd=root_dir)


def build_context(cfg: Config) -> str:
    instruction = cfg.instruction or "README に従って次に進める"
    readme_text = cfg.readme_file.read_text(encoding="utf-8")
    status = git_status_porcelain(cfg.root_dir)

    return (
        "\n".join(
            [
                "## Context",
                "",
                "### Instruction",
                instruction,
                "",
                "### Repo",
                f"- root: {cfg.root_dir}",
                f"- branch: {git_branch(cfg.root_dir)}",
                "",
                "### Git status (porcelain)",
                status,
                "",
                "### README",
                readme_text,
            ]
        ).rstrip()
        + "\n"
    )


def tee_process(cmd: list[str], cwd: Path, prompt: str, out_file: Path) -> int:
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with out_file.open("w", encoding="utf-8") as f:
        f.write(f"$ {' '.join(cmd)}\n")
        f.flush()

        p = subprocess.Popen(
            cmd,
            cwd=str(cwd),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        assert p.stdin is not None
        assert p.stdout is not None
        p.stdin.write(prompt)
        p.stdin.close()

        for line in p.stdout:
            sys.stdout.write(line)
            sys.stdout.flush()
            f.write(line)
            f.flush()

        return p.wait()


def provider_cmd(cfg: Config) -> list[str]:
    if cfg.provider == "cursor":
        # NOTE: `cursor agent` は prompt を stdin から与える（長文でも壊れない）
        return [
            "cursor",
            "agent",
            "--print",
            "--output-format",
            "text",
            "--approve-mcps",
            "--workspace",
            str(cfg.root_dir),
            "-",  # read prompt from stdin
        ]
    if cfg.provider == "claude":
        # NOTE: claude は非対話 `-p/--print`。promptは stdin 経由で渡す。
        return [
            "claude",
            "--print",
            "--output-format",
            "text",
            "--permission-mode",
            "bypassPermissions",
            "--settings",
            str(cfg.root_dir / ".claude" / "settings.json"),
            "-",  # read prompt from stdin
        ]
    if cfg.provider == "codex":
        return [
            "codex",
            "exec",
            "--full-auto",
            "--cd",
            str(cfg.root_dir),
            "-",  # read prompt from stdin
        ]
    raise ValueError(f"unknown PROVIDER: {cfg.provider} (expected: cursor|claude|codex)")


def main() -> int:
    cfg = load_config(sys.argv[1:])

    if cfg.stop_file.exists():
        print(f"stop file found: {cfg.stop_file}")
        return 0

    require_file(cfg.readme_file)
    require_file(cfg.prompt_dir / "pm.md")
    require_file(cfg.prompt_dir / "engineer.md")

    cfg.tmp_dir.mkdir(parents=True, exist_ok=True)
    runs_dir = cfg.tmp_dir / "runs"
    runs_dir.mkdir(parents=True, exist_ok=True)

    run_id = time.strftime("%Y%m%d-%H%M%S")
    run_dir = runs_dir / f"{run_id}-{cfg.provider}"
    run_dir.mkdir(parents=True, exist_ok=True)

    pm_prompt = (cfg.prompt_dir / "pm.md").read_text(encoding="utf-8").rstrip() + "\n\n" + build_context(cfg)
    engineer_prefix = (cfg.prompt_dir / "engineer.md").read_text(encoding="utf-8").rstrip() + "\n\n"

    (run_dir / "pm.prompt.md").write_text(pm_prompt, encoding="utf-8")

    if cfg.dry_run:
        engineer_prompt = engineer_prefix + "## PM output (reference)\n(dry-run: not executed)\n\n" + build_context(cfg)
        (run_dir / "engineer.prompt.md").write_text(engineer_prompt, encoding="utf-8")
        print(f"dry-run: wrote prompts to {run_dir}")
        return 0

    cmd = provider_cmd(cfg)

    pm_out = run_dir / "pm.txt"
    print("== pm ==")
    pm_code = tee_process(cmd, cwd=cfg.root_dir, prompt=pm_prompt, out_file=pm_out)
    if pm_code != 0:
        return pm_code

    engineer_prompt = engineer_prefix + "## PM output (reference)\n" + pm_out.read_text(encoding="utf-8") + "\n" + build_context(cfg)
    (run_dir / "engineer.prompt.md").write_text(engineer_prompt, encoding="utf-8")

    engineer_out = run_dir / "engineer.txt"
    print("== engineer ==")
    engineer_code = tee_process(cmd, cwd=cfg.root_dir, prompt=engineer_prompt, out_file=engineer_out)
    if engineer_code != 0:
        return engineer_code

    print(f"ok: {run_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


