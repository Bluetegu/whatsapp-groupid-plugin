#!/usr/bin/env python3
"""
Development server for WhatsApp Group ID Extractor Chrome Extension
Serves test files and provides development utilities
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

class ExtensionDevServer:
    def __init__(self, port=8000):
        self.port = port
        self.directory = Path(__file__).parent
        
    def start(self):
        """Start the development server"""
        os.chdir(self.directory)
        
        handler = http.server.SimpleHTTPRequestHandler
        
        print(f"🚀 Starting WhatsApp Group ID Extractor Development Server")
        print(f"📂 Serving from: {self.directory}")
        print(f"🌐 Server URL: http://localhost:{self.port}")
        print(f"🧪 Test page: http://localhost:{self.port}/test/test.html")
        print("📋 Extension files ready for Chrome developer mode")
        print("\n" + "="*50)
        print("Chrome Extension Installation:")
        print("1. Open chrome://extensions/")
        print("2. Enable 'Developer mode'")
        print("3. Click 'Load unpacked'")
        print(f"4. Select folder: {self.directory}")
        print("="*50 + "\n")
        
        try:
            with socketserver.TCPServer(("", self.port), handler) as httpd:
                print(f"✅ Server running on port {self.port}")
                print("Press Ctrl+C to stop the server\n")
                
                # Auto-open test page
                webbrowser.open(f"http://localhost:{self.port}/test/test.html")
                
                httpd.serve_forever()
                
        except KeyboardInterrupt:
            print("\n🛑 Development server stopped")
        except OSError as e:
            if "Address already in use" in str(e):
                print(f"❌ Port {self.port} is already in use")
                print(f"Try running with a different port: python dev_server.py --port 8001")
            else:
                print(f"❌ Error starting server: {e}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='WhatsApp Group ID Extractor Development Server')
    parser.add_argument('--port', '-p', type=int, default=8000, help='Server port (default: 8000)')
    
    args = parser.parse_args()
    
    server = ExtensionDevServer(port=args.port)
    server.start()

if __name__ == "__main__":
    main()