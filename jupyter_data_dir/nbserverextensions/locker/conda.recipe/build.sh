#!/bin/bash

# copy the nbserver extension into site-packages
mkdir -p $PREFIX/lib/python$PY_VER/site-packages/locker
cp -rf locker/* $PREFIX/lib/python$PY_VER/site-packages/locker

mkdir -p $PREFIX/etc/jupyter
cp -rf locker_config.py $PREFIX/etc/jupyter/locker_config.py
