# Anaconda Extensions for the Jupyter Notebook

## About
This package integrates the [Jupyter Notebook](http://jupyter.org) with
[Anaconda](https://www.continuum.io/downloads). With it `conda install`ed, you
can:
- create & manage `conda` environments within the Jupyter Notebook web
  application
- use R & Python kernels from all your `conda` environments
- share notebooks on [anaconda.org](http://anaconda.org)
- create slide-based presentations to show off your data

This bundle of extensions, or any individual extension, can be installed with
[`conda install`](http://conda.pydata.org/docs/intro.html).

## The Extensions

### Extensions distributed as Free Software (BSD License):
- [nb_conda](https://github.com/Anaconda-Platform/nb_conda) - manage conda environments from inside the Jupyter notebook
- [nb_conda_kernels](https://github.com/Anaconda-Platform/nb_conda_kernels) - launch R and Python kernels from any conda environment
- [nb_anacondacloud](https://github.com/Anaconda-Platform/nb_anacondacloud) - one-click publishing of  notebooks to Anaconda Cloud (free account required)
- [nbpresent](https://github.com/Anaconda-Platform/nbpresent) - Create beautiful slides from Jupyter Notebooks

### Extensions requiring a Workgroup/Enterprise Subscription:
> [Contact Continuum for more info](https://www.continuum.io/contact-us)

- nb_revision_control - provides basic revision control for notebooks
- nb_locker - soft-locking mechanism for shared notebooks

The latest conda-installable packages are available on
[Anaconda Cloud](https://anaconda.org/anaconda-nb-extensions).

## Quick Start
```
conda install anaconda-nb-extensions -c anaconda-nb-extensions
jupyter notebook
```

## Feedback, Bugs, Support
We love feedback!  Please open an
[issue](https://github.com/Anaconda-Platform/anaconda-nb-extensions/issues) on
this repo to give any feedback or open a PR on the individual extensions if you
are ready to roll-up your sleeves and get coding!

## More support
The [Anaconda mailing list](https://groups.google.com/a/continuum.io/forum/#!forum/anaconda)
is the best place to go for support-related questions.

## Developers
`anaconda-nb-extensions` is a meta-package specifying a set of sub-packages
as a cohesive bundle.

You can build your own version of the meta-package by doing:

```bash
conda install -n root conda-build
conda build conda.recipe
```

Then to install your locally-built version:
```shell
conda install anaconda-nb-extensions -c anaconda-nb-extensions --use-local
```

To get the latest development packages you can use:
```shell
conda install anaconda-nb-extensions -c anaconda-nb-extensions -c anaconda-nb-extensions/label/dev
```

> Note: we sometimes have pre-release versions of key upstream packages like
`notebook` here: be sure you want to live on the bleeding edge!

### Developing everything at once
Sometimes, you may need to have live versions of all of the code available in
a single environment. After checking all of the repos out as neighbors of this
repo, run:

```
_init_env.sh # or _init_env.bat
```

This will create an `anaconda-nb-extensions` environment, and install/symlink
all of the extensions.
