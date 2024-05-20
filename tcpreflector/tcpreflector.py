import sys
import socketserver
import argparse
import threading
import socket
from typing import List, cast

HEADER_SIZE = 64
HEADER_VERSION = 1

class TCPReflectorHandler(socketserver.BaseRequestHandler):
    transmit_thread : threading.Thread

    def handle(self):
        server : TCPReflectorServer = cast(TCPReflectorServer, self.server)
        server.handlers.append(self)
        self.transmit_thread = threading.Thread(target=self.handle_transmit)
        self.handle_receive()

    def log(self, msg : str):
        print(f"{sys.argv[0]}: {self.client_address}: {msg}")

    def stop(self):
        pass

    def receiver_forward(self, header : bytes, payload : bytes):
        server : TCPReflectorServer = cast(TCPReflectorServer, self.server)
        for other in server.handlers:
            if other == self:
                continue
            other.transmitter_forward(header, payload)
        pass
    
    def transmitter_forward(self, header : bytes, payload : bytes):
        pass

    def handle_transmit(self):
        pass

    def handle_receive(self):
        while self.request != None:
            sock : socket.socket = self.request
            header = sock.recv(HEADER_SIZE)
            if len(header) != HEADER_SIZE:
                self.log(f"short header, {len(header)} bytes")
                self.stop()
                break
            datalen = self._header_decode(header)
            if datalen < 0:
                self.stop()
                break
            payload = sock.recv(datalen)
            if len(payload) != datalen:
                self.log(f"short payload, wanted {datalen} bytes, got {len(payload)}")
                self.stop()
                break
            self.receiver_forward(header, payload)

    def _header_decode(self, header : bytes) -> int:
        return 0



class TCPReflectorServer(socketserver.ThreadingTCPServer):
    verbose : bool
    handlers : List[TCPReflectorHandler]
    pass

def main():
    global verbose
    parser = argparse.ArgumentParser(
        description="TCP reflection server"
    )
    parser.add_argument("port", action="store", type=int, default=9334, help="The port to serve on")
    parser.add_argument("host", action="store", default="", help="IP address or hostname to serve on (default: all interfaces)")
    parser.add_argument("verbose", action="store_true", help="Print verbose messages")

    args = parser.parse_args()
    with TCPReflectorServer((args.host, args.port), TCPReflectorHandler) as server:
        server.verbose = args.verbose
        server.serve_forever()

if __name__ == "__main__":
    main()
