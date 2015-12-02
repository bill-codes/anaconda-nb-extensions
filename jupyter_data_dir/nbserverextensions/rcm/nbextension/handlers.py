# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.

import logging
import os
import sys

from subprocess import check_output, CalledProcessError
from tornado import web

from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import IPythonHandler
from notebook.nbextensions import install_nbextension

import flatten

log = logging.getLogger(__name__)
log.setLevel(logging.DEBUG)

static = os.path.join(os.path.dirname(__file__), 'static')

SHA_LENGTH = 7

base_dir = os.getcwd()

class GitHandler(IPythonHandler):
    def rcm_run(self, cmd, *args, **kw):
        cmdline = cmd.split() + list(args)
        log.debug('command: %s', ' '.join(cmdline))

        output = check_output(cmdline)

        MAX_LOG_OUTPUT = 6000
        log.debug('output: %s', output[:MAX_LOG_OUTPUT])

        if len(output) > MAX_LOG_OUTPUT:
            log.debug('...')

        return output.decode('utf-8')

    def _init(self, path):
        """
        Create the repo, if needed, using `git init`
        """

        if not (path.endswith('.ipynb') and os.path.exists(path)):
            raise web.HTTPError(404)

        try:
            # see if we are in a git working tree
            self.rcm_run('git rev-parse --git-dir')
            # we are!

        except CalledProcessError:
            # we're not
            self.rcm_run('git init')
            self.rcm_run('git commit --allow-empty -m', 'Initial commit')


    def rcm_revision(self, path):
        """
        Return the current revision's SHA hash
        """

        output = self.rcm_run('git rev-parse HEAD')
        return output[:SHA_LENGTH]

    def rcm_log(self, path):
        """
        Return the revision history for the repo.
        """
        return self.rcm_run('git log master --graph', '--pretty=format:%h - %an, %ar : %s', '--', path)


    def rcm_diff(self, path):
        sha1 = self.get_argument('sha1', default=None)
        sha2 = self.get_argument('sha2', default=None)

        # Must supply start and end revision, or neither
        if sha1 and sha2:
            points = sha2 + '..' + sha1
        elif not sha1 and not sha2:
            points = ''
        else:
            raise web.HTTPError(400)

        rawdiff = self.rcm_run('git diff %s --no-prefix -U1000 --' % points, path)
        flat_diff = flatten.diff(rawdiff.splitlines())
        return flat_diff


    def git_stash(self):
        """
        Run `git stash` and return a boolean indicating whether a stash was created.
        This will be true if local changes were present, false otherwise.
        """

        output = self.rcm_run('git stash')
        return 'No local changes to save' not in output


    def rcm_commit(self, path):
        """
        Create a new commit on top of master containing the current notebook file,
        without merging. This is done by creating a new branch (if needed) and
        then merging it into master with `git merge -X theirs`.
        """

        message = self.get_argument('message')

        rev     = self.rcm_revision(path)
        branch  = 'ck_%s' % rev

        try:
            current_branch = self.rcm_run('git rev-parse --abbrev-ref HEAD').strip()
        except CalledProcessError:
            current_branch = 'master'

        if current_branch == 'master':
            stashed = self.git_stash()
            self.rcm_run('git checkout', rev, '-b', branch)
            if stashed:
                self.rcm_run('git stash pop')

        self.rcm_run('git add', path)
        self.rcm_run('git commit  --allow-empty -m', message)
        self.rcm_run('git checkout master')
        self.rcm_run('git merge -X theirs', branch)
        self.rcm_run('git branch -D', branch)
        return 'OK'


    def rcm_checkout(self, path):
        """
        Checkout the requested revision, discarding any current changes.
        """

        rev = self.get_argument('rev')
        stashed = self.git_stash()
        self.rcm_run('git checkout', rev, '-b', branch)
        if stashed:
            self.rcm_run('git stash drop')
        return 'OK'


    def run(self, action):
        path = self.get_argument('path')

        try:
            self._init(path)
            output = getattr(self, 'rcm_' + action)(path)
            self.finish(output)
        except CalledProcessError as exc:
            log.exception('Error in external command')
            self.clear()
            self.set_status(500)
            self.finish(exc.output)

    @web.authenticated
    def get(self, action):
        if action in ['revision', 'log', 'diff']:
            self.run(action)
        else:
            # Method Not Allowed
            raise web.HTTPError(405)

    @web.authenticated
    def post(self, action):
        self.run(action)





#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------


_git_action_regex = r"(?P<action>revision|log|diff|checkout|commit)"

default_handlers = [
    (r"/rcm/%s" % _git_action_regex, GitHandler),
]


def load_jupyter_server_extension(nbapp):
    """Load the nbserver extension"""
    log.info('loading RCM extension')

    windows = sys.platform.startswith('win')
    install_nbextension(static, destination='rcm', symlink=not windows, user=True)
    webapp = nbapp.web_app

    cfgm = nbapp.config_manager
    cfgm.update('notebook', {
        'load_extensions': {
            'rcm/main': True,
        }
    })
    base_url = webapp.settings['base_url']
    webapp.add_handlers(".*$", [
        (ujoin(base_url, pat), handler)
        for pat, handler in default_handlers
    ])

