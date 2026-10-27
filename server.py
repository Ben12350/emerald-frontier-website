from __future__ import annotations

import json
import math
import socket
import time
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


WEB_ROOT = Path(__file__).resolve().parent
SERVER_ROOT = WEB_ROOT.parent
MONITOR_FILE = SERVER_ROOT / "monitor-status.json"
SERVER_PROPERTIES = SERVER_ROOT / "server.properties"
MINECRAFT_HOST = "127.0.0.1"
MINECRAFT_PORT = 25565
HTTP_HOST = "0.0.0.0"
HTTP_PORT = 8088
MONITOR_MAX_AGE_SECONDS = 90


def is_server_open() -> bool:
    try:
        with socket.create_connection(
            (MINECRAFT_HOST, MINECRAFT_PORT), timeout=0.35
        ):
            return True
    except OSError:
        return False


def read_max_players() -> int:
    try:
        for line in SERVER_PROPERTIES.read_text(encoding="utf-8").splitlines():
            if line.startswith("max-players="):
                return max(1, int(line.partition("=")[2]))
    except (OSError, ValueError):
        pass
    return 500


def read_monitor_status() -> dict:
    try:
        if time.time() - MONITOR_FILE.stat().st_mtime > MONITOR_MAX_AGE_SECONDS:
            return {}
        data = json.loads(MONITOR_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError, TypeError):
        return {}


def finite_number(value, fallback=None):
    try:
        number = float(value)
        return number if math.isfinite(number) else fallback
    except (TypeError, ValueError):
        return fallback


def build_status() -> dict:
    online = is_server_open()
    maximum = read_max_players()
    checked_at = datetime.now(timezone.utc).isoformat()

    if not online:
        return {
            "ok": True,
            "online": False,
            "state": "OFFLINE",
            "statusText": "服务器未开放",
            "onlinePlayers": 0,
            "maxPlayers": maximum,
            "tps": None,
            "mspt": None,
            "checkedAt": checked_at,
        }

    monitor = read_monitor_status()
    players = max(0, int(finite_number(monitor.get("onlinePlayers"), 0)))
    tps = finite_number(monitor.get("tps"))
    mspt = finite_number(monitor.get("mspt"))
    state = str(monitor.get("status") or "NORMAL").upper()
    status_text = str(monitor.get("statusText") or "正常")

    return {
        "ok": True,
        "online": True,
        "state": state,
        "statusText": status_text,
        "onlinePlayers": players,
        "maxPlayers": maximum,
        "tps": round(tps, 2) if tps is not None else None,
        "mspt": round(mspt, 2) if mspt is not None else None,
        "checkedAt": checked_at,
    }


class WebsiteHandler(SimpleHTTPRequestHandler):
    server_version = "EmeraldFrontier/1.0"

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/status":
            self.send_json(build_status())
            return
        if path == "/api/health":
            self.send_json({"ok": True, "service": "emerald-frontier-website"})
            return
        if path == "/":
            self.path = "/index.html"
        super().do_GET()

    def send_json(self, payload: dict) -> None:
        body = json.dumps(
            payload,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        if self.path.startswith(("/api/", "/style.css", "/app.js", "/index.html")):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format_string: str, *args) -> None:
        print(f"[官网] {self.address_string()} {format_string % args}")


def main() -> None:
    handler = partial(WebsiteHandler, directory=str(WEB_ROOT))
    httpd = ThreadingHTTPServer((HTTP_HOST, HTTP_PORT), handler)
    print(f"翡翠战境动态官网已启动：http://192.168.101.17:{HTTP_PORT}")
    print("动态状态接口：/api/status")
    print("按 Ctrl+C 关闭官网。")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n正在关闭官网……")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
