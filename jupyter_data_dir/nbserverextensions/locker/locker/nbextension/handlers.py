# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.

import getpass
import logging
import os
import sys

from tornado import web

from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import APIHandler
from notebook.nbextensions import install_nbextension

log = logging.getLogger(__name__)
log.setLevel(logging.DEBUG)

static = os.path.join(os.path.dirname(__file__), 'static')

class LockHandler(APIHandler):
    def _get_lock_path(self, path):
        """
        Return the path to the lock file for a notebook.
        Raises HTTP error 404 if path does not refer to an existing notebook file.
        """

        if not (path.endswith('.ipynb') and os.path.exists(path)):
            raise web.HTTPError(404)

        dirname, filename = os.path.split(path)
        lock_filename = '.%s.lock' % filename[:-6]
        return os.path.join(os.getcwd(), dirname, lock_filename)

    @web.authenticated
    def post(self):
        """Set the current holder of the lock"""

        path = self.get_argument('path')
        user = self.get_argument('user')
        lock_path = self._get_lock_path(path)

        with open(lock_path, 'w') as f:
            f.write(user)
        self.finish('success')

    @web.authenticated
    def get(self):
        """Get the current holder of the lock"""

        path = self.get_argument('path')
        lock_path = self._get_lock_path(path)

        try:
            with open(lock_path) as f:
                content = f.readline()
        except IOError:
            content = ''
        self.finish(content.rstrip())

class WhoamiHandler(APIHandler):
    @web.authenticated
    def get(self):
        """Get the user who is running this server"""
        self.finish(getpass.getuser())


#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------

default_handlers = [
    (r"/lock", LockHandler),
    (r"/whoami", WhoamiHandler),
]


def load_jupyter_server_extension(nbapp):
    """Load the nbserver extension"""
    windows = sys.platform.startswith('win')
    install_nbextension(static, destination='locker', symlink=not windows, user=True)
    webapp = nbapp.web_app

    cfgm = nbapp.config_manager
    cfgm.update('notebook', {
        'load_extensions': {
            'locker/main': True,
        }
    })
    base_url = webapp.settings['base_url']
    webapp.add_handlers(".*$", [
        (ujoin(base_url, pat), handler)
        for pat, handler in default_handlers
    ])

