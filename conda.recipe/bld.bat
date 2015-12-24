set MAIN_DIR=%RECIPE_DIR%\..

mkdir                                          "%PREFIX%\etc\jupyter"
xcopy /Y /E %MAIN_DIR%\jupyter_config_dir\*    "%PREFIX%\etc\jupyter"
