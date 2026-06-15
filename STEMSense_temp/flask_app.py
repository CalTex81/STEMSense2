"""Flask web server for STEMSense.

Mode:
- Serves frontend static files (built output OR the existing Vite assets root if you configure it)
- Reverse-proxies API requests to the existing FastAPI backend

This keeps the current FastAPI integration unchanged while providing a single Flask-hosted site.
"""

from __future__ import annotations

import os
from typing import List

from flask import Flask, Response, request, send_from_directory, abort
import requests
from werkzeug.middleware.proxy_fix import ProxyFix


FASTAPI_BASE_URL = os.environ.get("FASTAPI_BASE_URL", "http://localhost:8000")

app = Flask(__name__, static_folder="frontend")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)


def _proxy_to_fastapi(path: str) -> Response:
    url = f"{FASTAPI_BASE_URL}{path}"

    # Forward query params, headers (minus hop-by-hop), and body.
    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in {"host", "content-length"}
    }

    resp = requests.request(
        method=request.method,
        url=url,
        params=request.args,
        headers=headers,
        data=request.get_data(),
        timeout=120,
    )

    excluded = {"content-encoding", "content-length", "transfer-encoding", "connection"}
    response_headers = [(k, v) for k, v in resp.headers.items() if k.lower() not in excluded]

    return Response(resp.content, resp.status_code, response_headers)


@app.route("/health")
def health():
    return {"status": "ok", "backend": FASTAPI_BASE_URL}


# Proxy API endpoints
@app.route("/detect", methods=["POST"])
def proxy_detect():
    return _proxy_to_fastapi("/detect")


@app.route("/analyze", methods=["POST"])
def proxy_analyze():
    return _proxy_to_fastapi("/analyze")


# Serve frontend pages
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    # Prefer serving existing static html files from frontend/ directory.
    # If you build Vite, update this to point to the build/ output.
    if path == "":
        candidate = os.path.join(app.static_folder, "index.html")
        if os.path.exists(candidate):
            return send_from_directory(app.static_folder, "index.html")
        abort(404)

    # Try to serve file
    fs_path = os.path.join(app.static_folder, path)
    if os.path.exists(fs_path) and os.path.isfile(fs_path):
        dir_name = os.path.dirname(fs_path)
        file_name = os.path.basename(fs_path)
        return send_from_directory(dir_name, file_name)

    # SPA fallback
    # If you later create a proper React Router SPA build, serve index.html here.
    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, "index.html")

    abort(404)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)

