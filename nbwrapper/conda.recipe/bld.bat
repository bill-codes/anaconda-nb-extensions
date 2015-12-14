"%PYTHON%" setup.py install
if errorlevel 1 exit 1

mkdir                            "%PREFIX%\etc\jupyter"
xcopy /Y /E jupyter_config_dir\*    "%PREFIX%\etc\jupyter"

mkdir                                       "%PREFIX%\share\jupyter\nbextensions"
xcopy /Y /E jupyter_data_dir\nbextensions\*    "%PREFIX%\share\jupyter\nbextensions"

mkdir          "%PREFIX%\Scripts"
xcopy /Y bin\*    "%PREFIX%\Scripts"
