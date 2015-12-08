# -*- coding: utf-8 -*-

import argparse
import errno
import os
from os.path import join, isdir
try:
    from inspect import signature
except ImportError:
    from funcsigs import signature
from jupyter_core.paths import jupyter_config_dir
from notebook.nbextensions import install_nbextension
from notebook.services.config import ConfigManager


class StaticPathNotFound(Exception):
    pass


def mkdir_p(path):
    """ 'mkdir -p' in Python """
    try:
        os.makedirs(path)
    except OSError as exc:  # Python >2.5
        if exc.errno == errno.EEXIST and isdir(path):
            pass
        else:
            raise


def enable(directory, **kwargs):
    """
    Enable the extension on every notebook
    """
    if "prefix" in kwargs:
        path = join(kwargs["prefix"], "etc", "jupyter")
    else:
        path = jupyter_config_dir()
    cm = ConfigManager(config_dir=path)
    mkdir_p(cm.config_dir)

    if 'main.js' in os.listdir(directory):
        cm.update(
            "notebook", {
                "load_extensions": {
                    "{}/main".format(kwargs['name']): True
                },
            }
        )
    if 'tree.js' in os.listdir(directory):
        cm.update(
            "tree", {
                "load_extensions": {
                    "{}/tree".format(kwargs['name']): True
                },
            }
        )
    if 'edit.js' in os.listdir(directory):
        cm.update(
            "edit", {
                "load_extensions": {
                    "{}/edit".format(kwargs['name']): True
                },
            }
        )
    print(' '.join(['Enabling', kwargs['name'], '\033[92m', '✔' + '\033[0m']))
    enable_server_extension(**kwargs)


def enable_server_extension(**kwargs):
    if "prefix" in kwargs:
        path = join(kwargs["prefix"], "etc", "jupyter")
    else:
        path = jupyter_config_dir()
    fn = os.path.join(path, 'jupyter_notebook_config.py')
    with open(fn, 'r+') as fh:
        lines = fh.read()
        if kwargs['name'] not in lines:
            fh.seek(0, 2)
            fh.write('\n')
            fh.write(
                "c.NotebookApp.server_extensions.append('{}.nbextension')".format(kwargs['name']))


def _install_args(**kwargs):
    kwargs['verbose'] = 0
    if kwargs['verbose']:
        kwargs['verbose'] = 2
    kwargs["destination"] = kwargs['name']
    del kwargs['enable']
    del kwargs['name']
    del kwargs['version']
    return kwargs


def install(directory, **kwargs):
    """Install the nbextension assets and optionally enables the
       nbextension and server extension for every run.
    Parameters
    ----------
    directory: path
    **kwargs: keyword arguments
        Other keyword arguments passed to the install_nbextension command
    """
    kwargs = {k: v for k, v in kwargs.items() if not (v is None)}

    try:
        install_nbextension(directory, **_install_args(**kwargs))
        print(' '.join(['Installing', kwargs['name'], '\033[92m', '✔' + '\033[0m']))
        if kwargs['enable']:
            enable(directory, **kwargs)
    except Exception as e:
        print(e)
        print(' '.join(['Installing', kwargs['name'], '\033[91m', '✗' + '\033[0m']))


def install_cmd(parser_args, setup_args):
    params = dict(setup_args.items() + parser_args.__dict__.items())
    directory = params['static']
    del params['static']
    del params['main']
    install(directory, **params)


def disable_extension(name, cm):
    for _type in ['notebook', 'tree', 'edit']:
        cfg = cm.get(_type)
    try:
        del cfg[u'load_extensions']["{}/main".format(name)]
        cm.set(_type, cfg)
        print(' '.join(['Disabling', name, '\033[92m', '✔' + '\033[0m']))
    except KeyError:
        print("{} wasn't enabled as a {}. Nothing to do.".format(name, _type))


def remove_cmd(parser_args, setup_args):
    name = setup_args['name']
    if parser_args.prefix is None:
        path = jupyter_config_dir()
    else:
        path = join(parser_args.prefix, "etc", "jupyter")
    cm = ConfigManager(config_dir=path)
    disable_extension(name, cm)


def create_parser():
    parser = argparse.ArgumentParser(
        description="Install and uninstall nbextension")
    subparsers = parser.add_subparsers(title='subcommands')
    install_parser = subparsers.add_parser(
        "install",
        description="Install nbextension",
        help="Install nbextension"
    )
    install_parser.add_argument(
        "-e", "--enable",
        help="Automatically load server and nbextension on notebook launch",
        action="store_true"
    )

    default_kwargs = {'action': 'store', 'nargs': '?'}
    store_true_kwargs = {'action': 'store_true'}
    store_true = ["symlink", "overwrite", "quiet", "user"]
    install_kwargs = list(signature(install_nbextension).parameters)
    [
        install_parser.add_argument(
            "--{}".format(arg),
            **(store_true_kwargs if arg in store_true else default_kwargs)
        )
        for arg in install_kwargs
    ]

    remove_parser = subparsers.add_parser(
        "remove",
        help="Remove an extension"
    )
    remove_parser.add_argument(
        "--prefix",
        action="store"
    )

    install_parser.set_defaults(main=install_cmd)
    remove_parser.set_defaults(main=remove_cmd)

    return parser


def find_static():
    static_path = os.path.join(os.getcwd(), 'static')
    if os.path.exists(static_path):
        return static_path
    else:
        raise StaticPathNotFound


def setup(**kwargs):
    parser = create_parser()
    args = parser.parse_args()
    args.main(args, kwargs)
