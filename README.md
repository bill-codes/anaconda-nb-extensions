# Anaconda notebook

**Conda recipe** to install Anaconda-notebook, a wrapper around `ipython notebook`.
Includes anaconda styles and specific extensions like:

- rcm
- calico-cell-tools
- calico-document-tools
- calico-spell-check

Run `conda build .`. Install it with `conda install anaconda-notebook --use-local`
and call it with `anaconda-notebook`. Once you execute this tool it will automatically
install the extension in `~/.ipython`.
