#!/bin/bash

# copy the nbserver extension into site-packages
mkdir -p $PREFIX/lib/python$PY_VER/site-packages/conda_envs
cp -rf conda_envs/* $PREFIX/lib/python$PY_VER/site-packages/conda_envs
