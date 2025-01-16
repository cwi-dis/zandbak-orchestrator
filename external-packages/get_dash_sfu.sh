#!/bin/bash

set -x
mkdir -p tmp

distr=lldash-linux-x86_64-0.9.3

curl --location --output tmp/$distr.tar.gz https://github.com/cwi-dis/lldash/releases/download/v0.9.3/$distr.tar.gz
# https://github.com/cwi-dis/VR2G-Evanescent/releases/download/v7.1.1_stable/evanescent.tar.bz2
rm -rf tmp/$distr
(cd tmp && tar xfv $distr.tar.gz)
rm -rf ../packages/lldash
mv tmp/$distr ../packages/lldash
rm -rf tmp
