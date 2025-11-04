#!/bin/sh

./copy.sh $1
rm -r ../md
pushd conv2md; npm run conv; popd


pushd ../; git add --all; git commit -m "update"; git push; popd;
