#!/bin/bash

BIN=$PREFIX/bin
EXEC=$BIN/anaconda-notebook
IPYTHON_CONFIG=$PREFIX/ipython_config
if [ $PY3K == 1 ]; then
	PKG_DIR=$PKG_NAME-$PKG_VERSION-py34_$PKG_BUILDNUM/ipython_config
else 
	PKG_DIR=$PKG_NAME-$PKG_VERSION-py27_$PKG_BUILDNUM/ipython_config
fi

mkdir -p $BIN
mkdir -p $IPYTHON_CONFIG
cp -rf $RECIPE_DIR/ipython_config/* $IPYTHON_CONFIG

cat <<EOF >$EXEC
#!/bin/sh

IPYTHON_DIR=$HOME/miniconda3/pkgs/$(echo $PKG_DIR) ipython notebook --profile=anaconda-notebook
EOF

chmod +x $EXEC
