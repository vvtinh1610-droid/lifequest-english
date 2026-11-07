"""Máy chủ thử game trên điện thoại qua Wi-Fi nhà, KHÔNG cho trình duyệt giữ bản cũ (luôn lấy code mới nhất).
Chạy: python tools/serve.py   → điện thoại mở http://<IP máy tính>:8123   (thêm ?test để có tài khoản test)
"""
import functools
import http.server
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    handler = functools.partial(NoCache, directory=str(ROOT))
    http.server.ThreadingHTTPServer(("0.0.0.0", 8123), handler).serve_forever()
