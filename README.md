# Anaconda notebook

This is the nascient anaconda-notebook which is based on the Jupyter notebook.

As you can see, this repo is mainly a conda recipe to build the anaconda-notebook
with the specific customizations, mainly extensions to enhance the user experience
and improve the communication with Anaconda Cloud, conda and other Continuum packages

To manually build the package, you should run:

`conda build conda.recipe`

To install it:

`conda install -c anaconda-notebook --use-local anaconda-notebook`

To get the latest development packages you can use:

`conda install -c anaconda-notebook -c anaconda-notebook/channel/dev anaconda-notebook`

NOTE:

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
