# Anaconda Notebook

## Quick Start

In its own environment sandbox (recommended):

```
conda create -n ananb -c anaconda-notebook anaconda-notebook
source activate ananb
anaconda-notebook
```

or if you just want to install it without an environment sandbox:

```
conda install -c anaconda-notebook anaconda-notebook
anaconda-notebook
```

![Conda tab added to Jupyter file browser](imgs/conda_tab.png?raw=true "Added Conda tab to browser")

## Background

This provides a wrapper around Jupyter to provide a richer range of Anaconda
integration with built-in support for conda environments (package sandboxes),
conda, and a set of extensions that can be installed with just `conda install`.

You can happily use Jupyter and Anaconda together **without** this package.
Jupyter is included in the full Anaconda distribution, and is a dependency of
this wrapper.

This is **not** a fork of Jupyter.  It is just a wrapper with a set
of tools and custom configuration of Jupyter (in the normal way) that make it
work in a way that will be beneficial for some users.  You still need regular
Jupyter installed.

**NOTE**: This "bundle" is designed to encapsulate a set of extensions into a
`conda` environment.  Because Jupyter currently will only look in one place
for extensions the `anaconda-notebook` wrapper points Jupyter to a directory
specific to the conda environment to pick up the set of conda-installable
extensions.  An implication of this is that **all other normally installed
Jupyter extesions in `~/.jupyter` will not be available*.  Yes, this is
sub-optimal, and yes we're working on a better way to deal with this (in fact,
we're aiming to get rid of `anaconda-notebook` altogether).

## Feedback, Bugs, Support

We love feedback.  Please open an issue on this repo to give any feedback or
open a PR if you have some code-change suggestions.

Found a bug? Open an issue.

Support? The (Anaconda mailing list)[https://groups.google.com/a/continuum.io/forum/#!forum/anaconda]
is the best place to go for support-related questions.

## Developers

This includes two conda recipes to build your own conda packages.  The two
pieces are:

* `anaconda-notebook` which is a meta-package specifying a set of sub-packages
as a cohesive bundle.

* `nbwrapper` which provides some "common code" and the actual wrapper scripts
(yes, confusingly it is `nbwrapper` that includes the `anaconda-notebook` **script**,
not the `anaconda-notebook` conda package!)

`nbwrapper` has its own `README` file (here)[nbwrapper/README.md]

You can build your own version of the meta-package by doing:

```bash
conda install conda-build
conda build conda.recipe
```

Then to install your locally built version:

```
conda install -c anaconda-notebook --use-local anaconda-notebook
```

To get the latest development packages you can use:

`conda install -c anaconda-notebook -c anaconda-notebook/channel/dev anaconda-notebook`

## How does this work?

This package install everything inside prefix. It means it will be completely
isolated. The  `JUPYTER_CONFIG_DIR` lives in `<prefix>/etc/jupyter` (or the
equivalent path for osx and win), whereas the `JUPYTER_DATA_DIR` lives in
`<prefix>/share/jupyter` (or the equivalent path for osx and win).
So, to have all the extensions available inside an specific conda environment,
you should install the `anaconda-notebook` package in that environment.
Alternative, you can start the `anaconda-notebook` in any environment and
execute python command in other environment just changing the kernel and selecting
the desired environment. In this case, the notebook server lives in the first
environment (where you started the `anaconda-notebook`), but the kernel lives in
the environment you choose from the kernel menu.

And to upload them to the `dev` channel:

`anaconda upload -u anaconda-notebook -dev path/to/the/package`
