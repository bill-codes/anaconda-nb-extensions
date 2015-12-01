import argparse
import os
import subprocess
from os.path import abspath, dirname, exists, join
from pprint import pprint
try:
    from inspect import signature
except ImportError:
    from funcsigs import signature

import yaml
from jupyter_core.paths import jupyter_config_dir, ENV_CONFIG_PATH
from notebook.nbextensions import install_nbextension
from notebook.services.config import ConfigManager


def enable_extension(config={}, **kwargs):
    """
    Enable the extension on every notebook
    """
    if "prefix" in kwargs:
        path = join(kwargs["prefix"], "etc", "jupyter")
        if not exists(path):
            print("Making directory", path)
            os.makedirs(path)
        cm = ConfigManager(config_dir=path)
    else:
        cm = ConfigManager()

    print("Enabling server component in", cm.config_dir)
    cfg = cm.get("jupyter_notebook_config")
    print("Existing config...")
    pprint(cfg)

    cm.update("jupyter_notebook_config", cfg)
    print("New config...")
    pprint(cm.get("jupyter_notebook_config"))

    try:
        subprocess.call(["conda", "info", "--root"])
        print("conda detected")
        _jupyter_config_dir = ENV_CONFIG_PATH[0]
    except OSError:
        print("conda not detected")
        _jupyter_config_dir = jupyter_config_dir()

    cm = ConfigManager(config_dir=join(_jupyter_config_dir, "nbconfig"))
    print(
        "Enabling nbextension at notebook launch in",
        cm.config_dir
    )

    if not exists(cm.config_dir):
        print("Making directory", cm.config_dir)
        os.makedirs(cm.config_dir)

    cm.update(
        "notebook", {
            "load_extensions": {
                "{}/{}".format(config['Name'], config['Main']): True
            },
        }
    )


def install(enable=False, **kwargs):
    """Install the nbextension assets and optionally enables the
       nbextension and server extension for every run.
    Parameters
    ----------
    enable: bool
        Enable the extension on every notebook launch
    **kwargs: keyword arguments
        Other keyword arguments passed to the install_nbextension command
    """
    try:
        with open('manifest.yaml') as yamlfile:
            config = yaml.load(yamlfile)
    except IOError:
        config = {}

    directory = join(abspath(dirname(__file__)), 'static')

    kwargs = {k: v for k, v in kwargs.items() if not (v is None)}

    kwargs["destination"] = config['Name']
    install_nbextension(directory, **kwargs)

    if enable:
        enable_extension(config, **kwargs)


if __name__ == '__main__':
    install_kwargs = list(signature(install_nbextension).parameters)

    parser = argparse.ArgumentParser(
        description="Install nbextension")
    parser.add_argument(
        "-e", "--enable",
        help="Automatically load server and nbextension on notebook launch",
        action="store_true")
    default_kwargs = dict(
        action="store",
        nargs="?"
    )
    store_true_kwargs = dict(action="store_true")
    store_true = ["symlink", "overwrite", "quiet", "user"]

    [
        parser.add_argument(
            "--{}".format(arg),
            **(store_true_kwargs if arg in store_true else default_kwargs)
        )
        for arg in install_kwargs
    ]

    install(**parser.parse_args().__dict__)
