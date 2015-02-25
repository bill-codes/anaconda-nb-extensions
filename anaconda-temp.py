#!/usr/bin/env python

import logging
import os
import shutil
import subprocess
import sys
import IPython


logger = logging.getLogger(__name__)


class AnacondaNotebook(object):
    def __init__(self, ipython_dir):
        self.ipython_dir = ipython_dir
        self.anaconda_dir = os.path.join(os.path.dirname(
            os.path.realpath(__file__)), '../etc/ipython_dir')
        if not self._is_installed():
            self._install()

    def run(self, argv):
        if not 'IPYTHONDIR' in os.environ:
            os.environ.get('IPYTHONDIR') == self.ipython_dir
        if not '--ipython-dir' in argv:
            argv.append('--ipython-dir')
            argv.append(self.ipython_dir)
        argv.append('--profile')
        argv.append('anaconda-notebook')
        argv = ['notebook'] + argv
        IPython.start_ipython(argv=argv)

    def _is_installed(self):
        return os.path.exists(
            os.path.join(self.ipython_dir, 'profile_anaconda-notebook'))

    def _install(self):
        ipython = os.path.join(sys.prefix, 'bin', 'ipython')
        subprocess.check_call(
            [
                ipython, 'profile', 'create', 'anaconda-notebook',
                '--ipython-dir', ipython_dir
            ]
        )
        shutil.copytree(
            os.path.join(self.anaconda_dir, 'profile_anaconda-notebook',
                'static', 'custom', 'custom.css'),
            os.path.join(self.ipython_dir, 'profile_anaconda-notebook',
                'static', 'custom','custom.css'),
            is_file=True
        )
        shutil.copytree(
            os.path.join(self.anaconda_dir, 'profile_anaconda-notebook',
                'static', 'custom', 'custom.js'),
            os.path.join(self.ipython_dir, 'profile_anaconda-notebook',
                'static', 'custom', 'custom.js'),
            is_file=True
        )
        shutil.copytree(
            os.path.join(self.anaconda_dir, 'profile_anaconda-notebook',
                'ipython_config.py'),
            os.path.join(self.ipython_dir, 'profile_anaconda-notebook',
                'ipython_config.py'),
            is_file=True
        )
        shutil.copytree(
            os.path.join(self.anaconda_dir, 'profile_anaconda-notebook',
                'ipython_nbconvert_config.py'),
            os.path.join(self.ipython_dir, 'profile_anaconda-notebook',
                'ipython_nbconvert_config.py'),
            is_file=True
        )
        shutil.copytree(
            os.path.join(self.anaconda_dir, 'profile_anaconda-notebook',
                'ipython_notebook_config.py'),
            os.path.join(self.ipython_dir, 'profile_anaconda-notebook',
                'ipython_notebook_config.py'),
            is_file=True
        )


if '--ipython-dir' in sys.argv:
    ipython_dir = sys.argv['--ipython-dir']
    #logger.warn('You may not have access to anaconda-notebook features')
elif 'IPYTHONDIR' in os.environ:
    ipython_dir = os.environ['IPYTHONDIR']
    #logger.warn('You may not have access to anaconda-notebook features')
else:
    ipython_dir = os.path.join(os.path.expanduser('~'), '.ipython')

anaconda_notebook = AnacondaNotebook(ipython_dir)
anaconda_notebook.run(sys.argv[1:])
