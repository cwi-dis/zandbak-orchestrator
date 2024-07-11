#!/bin/bash
# Usage
case x$1 in
x)
	echo Usage: $0 release
	echo Will download binaries from https://github.com/jvdrhoof/WebRTCSFU/releases/download/release
	echo and install them in the correct place here
	exit 1
	;;
x*)
	release=$1
	;;
esac
set -x
mkdir -p tmp

curl --location --output tmp/webrtcsfu-linux.tgz https://github.com/jvdrhoof/WebRTCSFU/releases/download/${release}/webrtcsfu-x86_64-unknown-linux.tgz
# curl --location --output tmp/webrtcsfu-macos.tgz https://github.com/jvdrhoof/WebRTCSFU/releases/download/${release}/webrtcsfu-x86_64-apple-darwin.tgz
# curl --location --output tmp/webrtcsfu-win.tgz https://github.com/jvdrhoof/WebRTCSFU/releases/download/${release}/webrtcsfu-x86_64-unknown-windows.tgz

rm -rf tmp/webrtc
mkdir tmp/webrtc
(cd tmp/webrtc ; tar xfv ../webrtcsfu-linux.tgz)
# (cd tmp/webrtc ; tar xfv ../webrtcsfu-macos.tgz)
# (cd tmp/webrtc ; tar xfv ../webrtcsfu-win.tgz)
case `uname` in
Darwin)
	xattr -d com.apple.quarantine tmp/webrtc/bin/*
	;;
esac
rm -rf ../config/packages/webrtc
mkdir -p ../config/packages/
mv tmp/webrtc ../config/packages/webrtc
rm -rf tmp
