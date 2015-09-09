#!/bin/bash

# ipython_dir content into $PREFIX/config
mkdir -p $PREFIX/config/ipython_dir
cp -rf config/ipython_dir/* $PREFIX/config/ipython_dir

# notebook wrapper script into $PREFIX/bin
mkdir -p $PREFIX/bin
cp -rf bin/* $PREFIX/bin
