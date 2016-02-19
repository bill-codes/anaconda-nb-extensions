# Anaconda Notebook

## Quick Start

In its own environment sandbox (recommended):

```
conda create -n ananb -c anaconda-nb-extensions anaconda-nb-extensions
source activate ananb
jupyter notebook
```

or if you just want to install it without an environment sandbox:

```
conda install -c anaconda-nb-extensions anaconda-nb-extensions
jupyter notebook
```

![Conda tab added to Jupyter file browser](imgs/conda_tab.png?raw=true "Added Conda tab to browser")

## Background

This package provides a set of Jupyter extensions intended to provide richer Anaconda
integration with built-in support for conda environments (package sandboxes),
conda environment/package management, support for sharing notebooks on
[anaconda.org](http://anaconda.org), and more.
This bundle of extensions, or any individual extension, can be installed with just `conda install`.

You can happily use Jupyter and Anaconda together **without** this package.
Jupyter is included in the full Anaconda distribution, and is a dependency of
this package.

This is **not** a fork of Jupyter.  It is a set
of tools and custom configuration of Jupyter that make it
work in a way that will be beneficial for some users.  You still need
Jupyter installed in order to use these extensions.

**NOTE**: This "bundle" is designed to encapsulate a set of extensions into a
`conda` environment.  It also includes nb_config_manager, which directs Jupyter
to look in the current conda environment to pick up the set of conda-installable
extensions.


## Feedback, Bugs, Support

We love feedback.  Please open an issue on this repo to give any feedback or
open a PR if you have some code-change suggestions.

Found a bug? Open an issue.

Support? The [Anaconda mailing list](https://groups.google.com/a/continuum.io/forum/#!forum/anaconda)
is the best place to go for support-related questions.

## Developers

`anaconda-nb-extensions` is a meta-package specifying a set of sub-packages
as a cohesive bundle.

You can build your own version of the meta-package by doing:

```bash
conda install conda-build
conda build conda.recipe
```

Then to install your locally built version:

```
conda install -c anaconda-nb-extensions --use-local anaconda-nb-extensions
```

To get the latest development packages you can use:

`conda install -c anaconda-nb-extensions -c anaconda-nb-extensions/channel/dev anaconda-nb-extensions`

And to upload them to the `dev` channel:

`anaconda upload -u anaconda-nb-extensions -dev path/to/the/package`

## How does this work?

This package installs everything inside prefix. It means it will be completely
isolated. The  `JUPYTER_CONFIG_DIR` lives in `<prefix>/etc/jupyter` (or the
equivalent path for osx and win), whereas the `JUPYTER_DATA_DIR` lives in
`<prefix>/share/jupyter` (or the equivalent path for osx and win).
So, to have all the extensions available inside a specific conda environment,
you should install the `anaconda-nb-extensions` package in that environment.
Alternative, you can start the `jupyter notebook` in any environment and
execute python command in other environment just changing the kernel and selecting
the desired environment. In this case, the notebook server lives in the first
environment (where you started the `jupyter notebook`), but the kernel lives in
the environment you choose from the kernel menu.
