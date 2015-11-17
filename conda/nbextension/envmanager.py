# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import json
import logging
import os

from pkg_resources import parse_version
from subprocess import check_output, CalledProcessError

from tornado import web

from traitlets.config.configurable import LoggingConfigurable
from traitlets import Dict, Instance, Float
from ipython_genutils import py3compat

log = logging.getLogger(__name__)

log.setLevel(logging.DEBUG)


def pkg_info(s):
    name, version, build = s.rsplit('-', 2)
    return {
        'name':    name,
        'version': version,
        'build':   build
    }


class EnvManager(LoggingConfigurable):
    envs = Dict()

    @staticmethod
    def _execute(cmd, *args):
        cmdline = cmd.split() + list(args)
        log.debug('command: %s', ' '.join(cmdline))

        try:
            output = check_output(cmdline)
        except CalledProcessError as exc:
            log.debug('exit code: %s', exc.returncode)
            output = exc.output

        MAX_LOG_OUTPUT = 6000
        log.debug('output: %s', output[:MAX_LOG_OUTPUT])

        if len(output) > MAX_LOG_OUTPUT:
            log.debug('...')

        return output

    def list_envs(self):
        """List all environments that conda knows about"""
        info = json.loads(self._execute('conda info --json'))
        default_env = info['default_prefix']

        root_env = {
                'name': 'root',
                'dir': info['root_prefix'],
                'is_default': info['root_prefix'] == default_env
        }

        def get_info(env):
            return {
                'name': os.path.basename(env),
                'dir': env,
                'is_default': env == default_env
            }

        return [root_env] + map(get_info, info['envs'])

    def delete_env(self, env):
        output = self._execute('conda env remove -y -q --json -n', env)
        output = '\n'.join(output.splitlines()[1:]) # discard 'Fetching package metadata...'
        return json.loads(output)

    def export_env(self, env):
        return self._execute('conda list -e -n', env)

    def clone_env(self, env, name):
        output = self._execute('conda create -y -q --json -n %(name)s --clone %(env)s' % locals())
        return json.loads(output)

    def env_packages(self, env):
        output = self._execute('conda list --no-pip --json -n', env)
        data = json.loads(output)
        if 'error' in data:
            # we didn't get back a list of packages, we got a dictionary with error info
            return data

        return map(pkg_info, data)

    def check_update(self, env, packages):
        output = self._execute('conda update --dry-run -q --json -n', env, *packages)
        data = json.loads(output)

        if 'error' in data:
            # we didn't get back a list of packages, we got a dictionary with error info
            return data
        elif 'actions' in data:
            def link_pkg(s):
                # LINK entries are package-version-build /path/to/link num
                return s.split(' ')[0]

            package_versions = map(link_pkg, data['actions'].get('LINK', []))
            return list(map(pkg_info, package_versions))
        else:
            # no action plan returned means everything is already up to date
            return []


    def install_packages(self, env, packages):
        output = self._execute('conda install -y -q --json -n', env, *packages)
        return json.loads(output)

    def update_packages(self, env, packages):
        output = self._execute('conda update -y -q --json -n', env, *packages)
        return json.loads(output)

    def remove_packages(self, env, packages):
        output = self._execute('conda remove -y -q --json -n', env, *packages)
        return json.loads(output)

    def package_search(self, q):
        output = self._execute('conda search --json', q)
        data = json.loads(output)

        if 'error' in data:
            # we didn't get back a list of packages, we got a dictionary with error info
            return data

        packages = []

        for name, entries in data.items():
            max_version = None
            max_version_entry = None

            for entry in entries:
                version = parse_version(entry.get('version', ''))

                if max_version is None or version > max_version:
                    max_version = version
                    max_version_entry = entry

            packages.append(max_version_entry)
        return sorted(packages, key=lambda entry:entry.get('name'))

