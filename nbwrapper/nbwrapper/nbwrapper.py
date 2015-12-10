#!/usr/bin/env python
import os
import sys

from notebook.notebookapp import NotebookApp

import logging
logger = logging.getLogger(__name__)

def main(jupyter_config_dir, jupyter_data_dir):
    # HACK to make read jupyter_config_dir from env because right now the frontend
    # config could be only loaded from the user space
    os.environ["JUPYTER_CONFIG_DIR"] = jupyter_config_dir
    os.environ["JUPYTER_DATA_DIR"]   = jupyter_data_dir

    # Launch the notebook instance with the proper args, capturing the user ones too
    args = sys.argv

    if len(args) == 1:
        args = []
    else:
        args = args[1:]

    NotebookApp.launch_instance(argv=args)
