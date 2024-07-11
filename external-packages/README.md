# Orchestrator external packages

The orchestrator needs external binaries, for the DASH SFU and the WebRTC SFU. (The tcpreflector SFU does not need an external package: it is a Python script that is included in this source tree).

Here you find two scripts which download the correct packages for use on Linux (and therefore also in the docker container), unpacks the package and stores it in `../config/packages`, where it will be picked up by the docker build procedure.

## webrtc sfu

Check <https://github.com/jvdrhoof/WebRTCSFU> for the latest current release _vX.Y.Z_. Then run

```
./get_webrtc_sfu.sh vX.Y.Z
```

##  dash sfu

The dash SFU is called `evanescent`. It is currently not open source, but it is freely usable. It is obtained from the <https://github.com/cwi-dis/VR2G-Evanescent> repository.

To install it run

```
./get_evanescent_sfu.sh
```
