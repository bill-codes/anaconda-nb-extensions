mkdir                         "%PREFIX%\etc\jupyter"
xcopy /E jupyter_config_dir\* "%PREFIX%\etc\jupyter"

mkdir                                            "%PREFIX%\share\jupyter\nbextensions"
xcopy /E jupyter_data_dir\nbextensions\defaulter "%PREFIX%\share\jupyter\nbextensions"
xcopy /E jupyter_data_dir\nbextensions\utils     "%PREFIX%\share\jupyter\nbextensions"
xcopy /E jupyter_data_dir\nbextensions\syncer    "%PREFIX%\share\jupyter\nbextensions"

mkdir       "%PREFIX%\Scripts"
xcopy bin\* "%PREFIX%\Scripts"
