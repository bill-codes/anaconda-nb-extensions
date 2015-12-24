#!/bin/bash

# jupyter_config_dir content into $PREFIX/etc/jupyter
mkdir -p                                   $PREFIX/etc/jupyter
cp -rf $RECIPE_DIR/jupyter_config_dir/*    $PREFIX/etc/jupyter
