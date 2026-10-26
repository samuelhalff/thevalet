"""Serve the static export for the private preview (thevalet.ark-fid.ch), never indexable.

Every response carries X-Robots-Tag: noindex; /robots.txt always disallows everything.
Usage: python3 serve.py <out_dir> [port]
"""
import functools
import http.server
import sys

ROOT, PORT = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 4610


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("X-Robots-Tag", "noindex, nofollow, noarchive")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/robots.txt":
            body = b"User-agent: *\nDisallow: /\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            try:
                with open(f"{ROOT}/404.html", "rb") as f:
                    body = f.read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            except OSError:
                pass
        super().send_error(code, message, explain)


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=ROOT)).serve_forever()
