#!/bin/sh

./copy.sh
rm -r ../md
pushd conv2md; npm run conv; popd


pushd ../; git add --all; git commit -m "update"; popd; .