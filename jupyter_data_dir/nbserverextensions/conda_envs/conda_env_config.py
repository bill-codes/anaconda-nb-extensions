# Configuration file to enable conda_envs extension

c = get_config()

c.NotebookApp.server_extensions.append('conda_envs.nbextension')
