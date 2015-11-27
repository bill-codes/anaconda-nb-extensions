mkdir "%PREFIX%\etc\jupyter"
xcopy /E jupyter_config_dir\* "%PREFIX%\etc\jupyter"

mkdir "%PREFIX%\share\jupyter\nbextensions"
xcopy /E jupyter_data_dir\nbextensions\* "%PREFIX%\share\jupyter\nbextensions"

mkdir "%PREFIX%\bin"
xcopy bin\* "%PREFIX%\Scripts"
