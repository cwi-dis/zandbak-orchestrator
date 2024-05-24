import sys
import socketserver
import argparse
import threading
import socket
import queue
from typing import List, cast, Tuple, Any

HEADER_SIZE = 128
HEADER_VERSION = 2
MAX_OUTPUT_QUEUE = 10

class TCPReflectorHandler(socketserver.BaseRequestHandler):
    transmit_thread : threading.Thread
    transmit_queue : "queue.Queue[bytes]"

    def handle(self):
        self.logVerbose("Connected")
        self.transmit_queue = queue.Queue(MAX_OUTPUT_QUEUE)
        server : TCPReflectorServer = cast(TCPReflectorServer, self.server)
        server.handlers.append(self)
        self.transmit_thread = threading.Thread(target=self.handle_transmit)
        self.transmit_thread.start()
        self.handle_receive()

    def log(self, msg : str):
        print(f"{sys.argv[0]}: {self.client_address}: {msg}", file=sys.stderr)

    def logVerbose(self, msg : str):
        server : TCPReflectorServer = cast(TCPReflectorServer, self.server)
        if server.verbose:
            self.log(msg)

    def stop(self):
        self.logVerbose("Disconnected")
        server : TCPReflectorServer = cast(TCPReflectorServer, self.server)
        server.handlers.remove(self)
        sock : socket.socket = self.request
        sock.close()
        self.request = None

    def receiver_forward(self, header : bytes, payload : bytes):
        server : TCPReflectorServer = cast(TCPReflectorServer, self.server)
        for other in server.handlers:
            if other == self:
                continue
            other.transmitter_forward(header, payload)
        pass
    
    def transmitter_forward(self, header : bytes, payload : bytes):
        packet = header+payload
        try:
            self.transmit_queue.put(packet, block=False)
        except queue.Full:
            self.log(f"Dropped {len(packet)} byte packet")

    def handle_transmit(self):
        self.logVerbose("Transmitter started")
        while self.request != None:
            sock : socket.socket = self.request
            try:
                packet = self.transmit_queue.get(timeout=1.0)
            except queue.Empty:
                continue
            sock.sendall(packet)
            self.logVerbose(f"Transmitted {len(packet)} byte packet") 
        self.logVerbose("Transmitter stopped")

    def handle_receive(self):
        self.logVerbose("Receiver started")
        while self.request != None:
            sock : socket.socket = self.request
            header = sock.recv(HEADER_SIZE)
            if len(header) != HEADER_SIZE:
                self.log(f"Received short header, {len(header)} bytes: {header}")
                self.stop()
                break
            datalen, streamName = self._header_decode(header)
            if datalen < 0:
                self.stop()
                break
            payload = sock.recv(datalen)
            if len(payload) != datalen:
                self.log(f"Received short payload, wanted {datalen} bytes, got {len(payload)}")
                self.stop()
                break
            packetLen = len(header) + len(payload)
            self.logVerbose(f"Received {packetLen} byte packet for stream {streamName}")
            self.receiver_forward(header, payload)
        self.logVerbose("Receiver stopped")

    def _header_decode(self, header : bytes) -> Tuple[int, str]:
        header_fields = header.decode().split(',')
        if len(header_fields) != 5 or header_fields[0] != str(HEADER_VERSION):
            self.log(f"Received invalid header: {header}")
            return -1, ""
        streamName = header_fields[1]
        dataSize = int(header_fields[3])
        return dataSize, streamName

class TCPReflectorServer(socketserver.ThreadingTCPServer):
    verbose : bool
    handlers : List[TCPReflectorHandler]

    def __init__(self, *args : Any, **kwargs : Any):
        self.handlers = []
        socketserver.ThreadingTCPServer.__init__(self, *args, **kwargs)

def main():
    global verbose
    parser = argparse.ArgumentParser(
        description="TCP reflection server"
    )
    parser.add_argument("--port", action="store", type=int, default=9334, help="The port to serve on")
    parser.add_argument("--host", action="store", default="", help="IP address or hostname to serve on (default: all interfaces)")
    parser.add_argument("--verbose", action="store_true", help="Print verbose messages")

    args = parser.parse_args()
    try:
        with TCPReflectorServer((args.host, args.port), TCPReflectorHandler) as server:
            server.verbose = args.verbose
            if args.verbose:
                print(f"{sys.argv[0]}: serving on {server.server_address}", file=sys.stderr)
            server.serve_forever()
    finally:
        print(f"{sys.argv[0]}: Shutting down", file=sys.stderr)

if __name__ == "__main__":
    main()
