#!/usr/bin/env python
import sys
import os
from os.path import join, exists, dirname
import tempfile
import shutil
import subprocess
import getpass

import IPython
import IPython.utils.io
import IPython.utils.path
import logging
logger = logging.getLogger(__name__)

## monkey patch IPython until they fix ACLs
def _copy_metadata(src, dst):
    """Ipython uses this to copy metadata (perms) from
    src to dst.  However when new notebooks are created,
    dst does not exist.  When new notebooks are created
    usually this function fails, and src is renamed to
    dst.  So what we do is make a tempfile, which will
    have the inherited ACLs, and then copy those to
    both the source and the dst.
    """
    base = dirname(dst)
    path = tempfile.NamedTemporaryFile(dir=base).name
    try:
        with open(path, "w+") as f:
            try:
                shutil.copymode(path, src)
            except:
                pass
            try:
                shutil.copymode(path, dst)
            except:
                pass
        st = os.stat(src)
        if hasattr(os, 'chflags') and hasattr(st, 'st_flags'):
            os.chflags(dst, st.st_flags)
    finally:
        os.remove(path)

IPython.utils.io._copy_metadata = _copy_metadata

old_ensure_dir_exists = IPython.utils.path.ensure_dir_exists

def ensure_dir_exists(path, mode=None):
    if mode:
        logger.error("we don't allow you to pass a mode for ensure_dir_exists, as it conflicts with ACLs")
    return old_ensure_dir_exists(path, mode=0o777)
IPython.utils.path.ensure_dir_exists = ensure_dir_exists

args = sys.argv
if len(args) == 1:
    args = None
else:
    args = args[1:]

#setup jupyter_config_dir
base_dir = os.environ.get('WAKARI_PROJECT_HOME')
if base_dir:
    jupyter_config_dir = join(base_dir, '.jupyter_%s' % getpass.getuser())
    jupyter_data_dir = join(base_dir, '.local', 'share',  'jupyter_%s' % getpass.getuser())
else:
    base_dir = os.environ.get('HOME')
    jupyter_config_dir = join(base_dir, '.jupyter')
    jupyter_data_dir = join(base_dir, '.local', 'share', 'jupyter')

if not exists(jupyter_config_dir):
    os.makedirs(jupyter_config_dir)
if not exists(join(jupyter_config_dir, 'custom')):
    os.makedirs(join(jupyter_config_dir, 'custom'))
if not exists(jupyter_data_dir):
    os.makedirs(jupyter_data_dir)

os.environ['JUPYTER_CONFIG_DIR'] = jupyter_config_dir
os.environ['JUPYTER_DATA_DIR'] = jupyter_data_dir

template_dir = join(dirname(dirname(__file__)), 'config', 'ipython_dir')

def copytree(src, dst, is_file=False):
    if not is_file:
        if exists(dst):
            shutil.rmtree(dst)
        return shutil.copytree(src, dst)
    else:
        if exists(dst):
            os.remove(dst)
        return shutil.copyfile(src, dst)

copytree(join(template_dir, 'nbextensions', 'defaulter'),
                join(jupyter_data_dir, 'nbextensions', 'defaulter'))
copytree(join(template_dir, 'nbextensions', 'syncer'),
                join(jupyter_data_dir, 'nbextensions', 'syncer'))
copytree(join(template_dir, 'nbextensions', 'locker'),
                join(jupyter_data_dir, 'nbextensions', 'locker'))
copytree(join(template_dir, 'nbextensions', 'utils'),
                join(jupyter_data_dir, 'nbextensions', 'utils'))
copytree(join(template_dir, 'nbextensions', 'rcm'),
                join(jupyter_data_dir, 'nbextensions', 'rcm'))
copytree(join(template_dir, 'profile_wakari', 'static', 'custom', 'custom.js'),
         join(jupyter_config_dir, 'custom', 'custom.js'),
         is_file=True
)
copytree(join(template_dir, 'profile_wakari', 'ipython_notebook_config.py'),
         join(jupyter_config_dir, 'jupyter_notebook_config.py'),
         is_file=True
)
copytree(join(template_dir, 'profile_wakari', 'ipython_kernel_config.py'),
         join(jupyter_config_dir, 'jupyter_kernel_config.py'),
         is_file=True
)
## run the syncer
cmd = [sys.executable,
       join(jupyter_data_dir, 'nbextensions', 'syncer', 'sync.py'),
       '-p',
       join(jupyter_data_dir, 'kernels')]
subprocess.check_call(cmd)
IPython.start_ipython(argv=args)
