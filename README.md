# Anaconda notebook

This is the nascient anaconda-notebook which is based on the Jupyter notebook.

As you can see, this repo is mainly a conda recipe to build the anaconda-notebook
with the specific customizations, mainly extensions to enhance the user experience
and improve the communication with Anaconda Cloud, conda and other Continuum packages

To manually build the package, you should run:

`conda build conda.recipe`

To install it:

conda install -c wakari --use-local anaconda-notebook

Note: the `wakari` channel is needed here to install the jsonpointer and pandoc
which are run dependencies for the anaconda-notebook.
