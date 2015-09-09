#!/opt/wakari/wakari-compute/bin/python
from __future__ import print_function
import subprocess
import sys
import os

import subprocess
import json
import IPython.utils.py3compat as py3compat
from os.path import join, abspath, realpath, split, exists, dirname
import logging

logger = logging.getLogger(__name__)

def find_metadata(path):
    """look up the directory tree for a metadata.json file.
    """
    if path == "/" or dirname(path) == path:
        # eventually we'll hit root... then exit
        # dirname(path) == path check put in, just in case
        # we run this in windows.  using that as the test for
        # whether we're at the root of the filesystem or not
        logger.debug("find_metadata reached root at %s, returning None", path)
        return None
    try:
        metdata_path = join(path, ".metadata.json")
        if exists(metdata_path):
            with open (metdata_path) as f:
                return json.load(f)
        else:
            return find_metadata(dirname(path))
    except OSError:
        # this can happen if we traverse to high up the tree and we don't
        # haver permissions
        logger.debug("find_metadata reached root at %s, returning None", path)
        return None

def package_executable(notebook_path):
    metadata = find_metadata(notebook_path)
    if metadata is None:
        return None
    envprefix = metadata['env']
    python = join(envprefix, 'bin', 'python')
    ipython = join(envprefix, 'bin', 'ipython')
    if exists(python) and exists(ipython):
        return python
    python = join(envprefix, 'bin', 'python3')
    ipython = join(envprefix, 'bin', 'ipython3')
    if exists(python) and exists(ipython):
        return python

def which_wakari_python(name):
    """only checks WAKARI_PROJECT_ENV, and /opt/wakari/anaconda
    """
    def _executable(base, name):
        executable = join(base, 'bin', name)
        if exists(executable):
            return executable
    base = os.environ.get('WAKARI_PROJECT_ENV')
    executable = None
    if base:
        executable = _executable(base, name)
    if executable:
        return executable
    # placeholder, if we use the WAKARI_ANACONDA env var,
    # then maybe some point, this can be configureable
    base = os.environ.get('WAKARI_ANACONDA', '/opt/wakari/anaconda')
    executable = _executable(base, name)
    return executable

executable = package_executable(os.getcwd())
if executable is None:
    executable = which_wakari_python('python')
if executable is None:
    executable = which_wakari_python('python3')
if executable is None:
    executable = sys.executable
cmd = [executable] + sys.argv[1:]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                     stdout=sys.stdout,
                     stderr=sys.stderr)
p.stdin.close()
p.wait()
