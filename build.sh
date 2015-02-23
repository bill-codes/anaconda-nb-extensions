#!/bin/bash

BIN=$PREFIX/bin
EXEC=$BIN/anaconda-notebook
ETC=$PREFIX/etc/

mkdir -p $BIN
mkdir -p $ETC

cp -rf $RECIPE_DIR/ipython_config/ $ETC
cp anaconda-notebook $BIN/

chmod +x $EXEC
