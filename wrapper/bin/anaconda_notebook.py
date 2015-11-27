#!/usr/bin/env python
import os
import shutil
import site
import subprocess
import sys

from os.path import join, exists

from jupyter_core import paths
from notebook.notebookapp import NotebookApp

import logging
logger = logging.getLogger(__name__)

def main(jupyter_config_dir, jupyter_data_dir):
    # HACK to make read jupyter_config_dir from env because right now the frontend
    # config could be only loaded from the user space
    os.environ["JUPYTER_CONFIG_DIR"] = jupyter_config_dir
    os.environ["JUPYTER_DATA_DIR"] = jupyter_data_dir

    # NOTE: all the config and data files (extensions) are copied by the conda recipe
    # TODO: use config manager to load the extension
    # TODO: load theme by template
    # TODO: put template and logo into anaconda_custom

    # Run the syncer
    # TODO: we need to evaluate the migration of this to a server-based extension
    # triggered before the notebook load the kernels...
    # TODO: Use a KernelSpec custom manager to do this...
    cmd = [sys.executable,
           join(jupyter_data_dir, 'nbextensions', 'syncer', 'sync.py'),
           '-p',
           join(jupyter_data_dir, 'kernels')]

    subprocess.check_call(cmd)

    # Launch the notebook instance with the proper args, capturing the user ones too
    args = sys.argv

    if len(args) == 1:
        args = []
    else:
        args = args[1:]

    # TODO:
    # * Launch from the executable but also from jupyter notebook --anaconda
    # * Provide options to install into the --user ans --system space
    # * Deal with extension installed from outside the repo
    NotebookApp.launch_instance(argv=args)
