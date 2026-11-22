"""Production-like local server for Site/.

Mirrors the Hostinger .htaccess behaviour that matters for testing:
  * directory URLs serve index.html; a directory without index.html is NOT listed (404)
  * /dir (no slash) -> 301 /dir/  (like mod_dir DirectorySlash)
  * unknown URLs return the custom 404.html with a real 404 status
  * hidden files (.htaccess, .git ...) are refused
  * every response carries the exact `Header always set` lines from Site/.htaccess (CSP etc.)

Usage: python3 tools/serve.py [port]      (default 8080)
"""
import gzip, http.server, io, os, re, sys

SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Site"))
HEADERS = re.findall(r'^\s*Header always set ([\w-]+) "(.*)"\s*$', open(os.path.join(SITE, ".htaccess")).read(), re.M)
HEADERS = [(k, v) for k, v in HEADERS if k != "Strict-Transport-Security"]   # http only locally


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=SITE, **kw)

    def end_headers(self):
        for k, v in HEADERS:
            self.send_header(k, v.replace(" upgrade-insecure-requests", "").rstrip("; ").rstrip(";"))
        super().end_headers()

    def list_directory(self, path):          # Options -Indexes
        self.send_404(); return None

    def send_404(self):
        body = open(os.path.join(SITE, "404.html"), "rb").read()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def send_head(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if re.search(r"(^|/)\.(?!well-known/)", path):
            self.send_404(); return None
        fs = self.translate_path(self.path)
        if os.path.isdir(fs):
            if not path.endswith("/"):
                self.send_response(301); self.send_header("Location", path + "/" + ("?" + self.path.split("?", 1)[1] if "?" in self.path else "")); self.end_headers(); return None
            if not os.path.exists(os.path.join(fs, "index.html")):
                self.send_404(); return None
        elif not os.path.exists(fs):
            self.send_404(); return None
        ctype = self.guess_type(fs if not os.path.isdir(fs) else os.path.join(fs, "index.html"))
        if "gzip" in self.headers.get("Accept-Encoding", "") and re.match(r"(text/|application/(javascript|json|xml)|image/svg)", ctype or ""):
            target = os.path.join(fs, "index.html") if os.path.isdir(fs) else fs
            self._gz = gzip.compress(open(target, "rb").read(), 6)
            self.send_response(200)
            self.send_header("Content-Type", ctype + ("; charset=utf-8" if ctype.startswith("text/") else ""))
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(self._gz)))
            self.end_headers()
            return io.BytesIO(b"")
        return super().send_head()

    def copyfile(self, source, outputfile):
        # gzip text responses like LiteSpeed/Apache do (set up in send_head)
        if getattr(self, "_gz", None) is not None:
            outputfile.write(self._gz); self._gz = None
        else:
            super().copyfile(source, outputfile)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"Serving {SITE} at http://127.0.0.1:{port}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
