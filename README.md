# Anaconda notebook

This is the nascient anaconda-notebook which is based on the Jupyter notebook.

As you can see, this repo is mainly a conda recipe to build the anaconda-notebook
with the specific customizations, mainly extensions to enhance the user experience
and improve the communication with Anaconda Cloud, conda and other Continuum packages

To manually build the package, you should run:

`conda build -c wakari conda.recipe`

Note: thw `wakari` channel is needed here to build with the jsonpointer dependency
which is the run dependency for the anaconda-notebook.
