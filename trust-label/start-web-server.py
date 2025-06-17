#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

print(f"Iniciando servidor na porta {PORT}...")
print(f"Servindo arquivos de: {DIRECTORY}")
print("\nAcesse o TRUST Label em:")
print("  http://localhost:8001/trust-label-interactive.html")
print("  http://localhost:8001/trust-label-dashboard.html")
print("  http://localhost:8001/trust-label-public-report.html")
print("\nPressione Ctrl+C para parar o servidor\n")

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor parado.")