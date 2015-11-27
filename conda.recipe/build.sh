#!/bin/bash

# jupyter_config_dir content into $PREFIX/etc/jupyter
mkdir -p $PREFIX/etc/jupyter
cp -rf jupyter_config_dir/* $PREFIX/etc/jupyter

# jupyter_data_dir/nbextensions content into $PREFIX/share/jupyter/nbextensions
mkdir -p $PREFIX/share/jupyter/nbextensions
cp -rf jupyter_data_dir/nbextensions/* $PREFIX/share/jupyter/nbextensions

# notebook wrapper script into $PREFIX/bin
mkdir -p $PREFIX/bin
cp -rf bin/* $PREFIX/bin
