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

    # Our own copytree, we are forcing the installation on every start
    # TODO: we probably need a soft default checking if there is a file or folder
    # and enable a --force option.
    # TODO: evaluate the migration to use the jupyter nbextension install mechanism
    def copytree(src, dst, is_file=False):
        if not is_file:
            if exists(dst):
                shutil.rmtree(dst)
            return shutil.copytree(src, dst)
        else:
            if exists(dst):
                os.remove(dst)
            return shutil.copyfile(src, dst)

    # NOTE: all the config and data files (extensions) are copied by the conda recipe
    # TODO: use config manager to load the extension
    # TODO: load theme by template
    # TODO: put template and logo into anaconda_custom

    # Copy nbserextensions extensions
    # TODO: deal with installation in the extension conda recipe, not here...
    nbserextensions = ['conda-envs']

    site_packages = site.getsitepackages()[0]

    for nbserextension in nbserextensions:
        copytree(join(jupyter_data_dir, 'nbserextensions', nbserextension),
                 join(site_packages, nbserextension))

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

    # Load our custom config file
    config_file = join(jupyter_config_dir, "anaconda_notebook_config.py")

    # TODO:
    # * Launch from the executable but also from jupyter notebook --anaconda
    # * Provide options to install into the --user ans --system space
    # * Deal with extension installed from outside the repo
    NotebookApp.launch_instance(argv=args, config_file=config_file)
