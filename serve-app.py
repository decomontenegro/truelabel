#!/usr/bin/env python3

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configurações
PORT = 3001
DIRECTORY = "client/dist"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Adicionar headers CORS para desenvolvimento
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Para SPA, redirecionar rotas não encontradas para index.html
        if not os.path.exists(os.path.join(DIRECTORY, self.path.lstrip('/'))):
            if not self.path.startswith('/assets/') and not self.path.startswith('/js/'):
                self.path = '/index.html'
        
        return super().do_GET()

def main():
    # Verificar se o diretório existe
    if not os.path.exists(DIRECTORY):
        print(f"❌ Erro: Diretório '{DIRECTORY}' não encontrado!")
        print("Execute este script na raiz do projeto True Label")
        sys.exit(1)
    
    # Verificar se index.html existe
    index_path = os.path.join(DIRECTORY, 'index.html')
    if not os.path.exists(index_path):
        print(f"❌ Erro: '{index_path}' não encontrado!")
        print("Execute 'npm run build' no diretório client primeiro")
        sys.exit(1)
    
    print("🏷️  True Label - Servidor de Desenvolvimento")
    print("=" * 50)
    print(f"📁 Servindo arquivos de: {DIRECTORY}")
    print(f"🌐 URL: http://localhost:{PORT}")
    print("⏹️  Para parar: Pressione Ctrl+C")
    print()
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"✅ Servidor iniciado na porta {PORT}")
            print(f"🚀 Acesse: http://localhost:{PORT}")
            print()
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuário")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Erro: Porta {PORT} já está em uso!")
            print("Execute: lsof -ti:3001 | xargs kill -9")
        else:
            print(f"❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
