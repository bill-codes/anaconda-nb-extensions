#!/bin/bash

# set dir references
MAIN_DIR=$RECIPE_DIR/..

# jupyter_config_dir content into $PREFIX/etc/jupyter
mkdir -p                                 $PREFIX/etc/jupyter
cp -rf $MAIN_DIR/jupyter_config_dir/*    $PREFIX/etc/jupyter
