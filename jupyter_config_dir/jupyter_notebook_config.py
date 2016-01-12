# Configuration file for the anaconda-nb-extensions metapackage

c = get_config()

c.NotebookApp.server_extensions.append('ipyparallel.nbextension')
