# Configuration file for anaconda-notebook.

c = get_config()

c.NotebookApp.server_extensions.append('ipyparallel.nbextension')

from jupyter_core import paths
from os.path import join

template_path = join(paths.jupyter_config_dir(), "custom", "templates")

c.NotebookApp.extra_template_paths = [template_path]
