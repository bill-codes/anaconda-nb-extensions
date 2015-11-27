# enable conda_env extension adding a line to a pre-existing config file or
# creating a new one.
if [ -e $PREFIX/etc/jupyter/jupyter_notebook_config.py ]; then
    config=$(cat jupyter_notebook_config.py)
    if [[ "$config" == *"conda_envs"* ]]; then 
        echo "The conda_envs extension is already enabled."
    else
        echo "c.NotebookApp.server_extensions.append('conda_envs.nbextension')" >> $PREFIX/etc/jupyter/jupyter_notebook_config.py
    fi
else
    mkdir -p $PREFIX/etc/jupyter
    cp -rf jupyter_notebook_config.py $PREFIX/etc/jupyter
fi
