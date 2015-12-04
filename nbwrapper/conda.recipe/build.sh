#!/bin/bash
$PYTHON setup.py install

# set dir references
NBWRAPPER_DIR=$RECIPE_DIR/..
MAIN_DIR=$NBWRAPPER_DIR/..

# jupyter_config_dir content into $PREFIX/etc/jupyter
mkdir -p                                 $PREFIX/etc/jupyter
cp -rf $MAIN_DIR/jupyter_config_dir/*    $PREFIX/etc/jupyter

# jupyter_data_dir/nbextensions content into $PREFIX/share/jupyter/nbextensions
mkdir -p                                            $PREFIX/share/jupyter/nbextensions
cp -rf $MAIN_DIR/jupyter_data_dir/nbextensions/*    $PREFIX/share/jupyter/nbextensions

# nbwrapper scripts into $PREFIX/bin
mkdir -p                       $PREFIX/bin
cp -rf $NBWRAPPER_DIR/bin/*    $PREFIX/bin
