#!/bin/bash

# jupyter_config_dir content into $PREFIX/etc/anaconda_notebook/jupyter_config_dir
mkdir -p $PREFIX/etc/anaconda_notebook/jupyter_config_dir
cp -rf jupyter_config_dir/* $PREFIX/etc/anaconda_notebook/jupyter_config_dir

# jupyter_data_dir content into $PREFIX/share/anaconda_notebook/jupyter_data_dir
mkdir -p $PREFIX/share/anaconda_notebook/jupyter_data_dir
cp -rf jupyter_data_dir/* $PREFIX/share/anaconda_notebook/jupyter_data_dir

# notebook wrapper script into $PREFIX/bin
mkdir -p $PREFIX/bin
cp -rf bin/* $PREFIX/bin
