# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.

import json
import logging
import os
import sys

from tornado import web

from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import IPythonHandler
from notebook.nbextensions import install_nbextension

log = logging.getLogger(__name__)
log.setLevel(logging.DEBUG)


from .envmanager import EnvManager

static = os.path.join(os.path.dirname(__file__), 'static')

class EnvHandler(IPythonHandler):

    @property
    def env_manager(self):
        return self.settings['env_manager']

class MainEnvHandler(EnvHandler):

    @web.authenticated
    def get(self):
        self.finish(json.dumps(self.env_manager.list_envs()))


class EnvHandler(EnvHandler):

    @web.authenticated
    def get(self, env):
        self.finish(json.dumps(self.env_manager.env_packages(env)))


class EnvActionHandler(EnvHandler):

    @web.authenticated
    def get(self, env, action):
        if action == 'export':
            # export environment file
            self.set_header('Content-Disposition', 'attachment; filename="%s"' % (env + '.env'))
            self.finish(self.env_manager.export_env(env))
        else:
            raise web.HTTPError(400)

    @web.authenticated
    def post(self, env, action):
        if action == 'delete':
            data = self.env_manager.delete_env(env)
        elif action == 'clone':
            name = self.get_argument('name', default=None)
            if not name:
                name = env + '-copy'
            data = self.env_manager.clone_env(env, name)
        elif action == 'update':
            # TODO - some kind of 'check for updates/apply updates' workflow
            raise NotImplementedError
        self.finish(json.dumps(data))


class EnvPkgActionHandler(EnvHandler):

    @web.authenticated
    def post(self, env, action):
        log.debug('req body: %s', self.request.body)
        packages = self.get_arguments('packages[]')
        if not packages:
            raise web.HTTPError(400)

        if action == 'install':
            resp = self.env_manager.install_packages(env, packages)
        elif action == 'update':
            resp = self.env_manager.update_packages(env, packages)
        elif action == 'check':
            resp = self.env_manager.check_update(env, packages)
        elif action == 'remove':
            resp = self.env_manager.remove_packages(env, packages)
        else:
            raise web.HTTPError(400)

        self.finish(json.dumps(resp))


class SearchHandler(EnvHandler):

    @web.authenticated
    def get(self):
        q = self.get_argument('q')
        self.finish(json.dumps(self.env_manager.package_search(q)))



#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------


_env_action_regex = r"(?P<action>export|clone|delete)"
_env_regex = r"(?P<env>[^\/]+)" # there is almost no text that is invalid

_pkg_regex = r"(?P<pkg>[^\/]+)"
_pkg_action_regex = r"(?P<action>install|update|check|remove)"

default_handlers = [
    (r"/environments", MainEnvHandler),
    (r"/environments/%s/packages/%s" % (_env_regex, _pkg_action_regex), EnvPkgActionHandler),
    (r"/environments/%s/%s" % (_env_regex, _env_action_regex), EnvActionHandler),
    (r"/environments/%s" % _env_regex, EnvHandler),
    (r"/packages/search", SearchHandler),
]


def load_jupyter_server_extension(nbapp):
    """Load the nbserver extension"""
    windows = sys.platform.startswith('win')
    install_nbextension(static, destination='conda-envs', symlink=not windows, user=True)
    webapp = nbapp.web_app
    webapp.settings['env_manager'] = EnvManager(parent=nbapp)

    cfgm = nbapp.config_manager
    cfgm.update('tree', {
        'load_extensions': {
            'conda-envs/main': True,
        }
    })
    base_url = webapp.settings['base_url']
    webapp.add_handlers(".*$", [
        (ujoin(base_url, pat), handler)
        for pat, handler in default_handlers
    ])

