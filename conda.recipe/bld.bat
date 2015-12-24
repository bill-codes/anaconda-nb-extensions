mkdir                                            "%PREFIX%\etc\jupyter"
xcopy /Y /E %RECIPE_DIR%\jupyter_config_dir\*    "%PREFIX%\etc\jupyter"
