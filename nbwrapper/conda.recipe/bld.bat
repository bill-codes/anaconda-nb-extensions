"%PYTHON%" setup.py install
if errorlevel 1 exit 1

set NBWRAPPER_DIR=%RECIPE_DIR%\..
set MAIN_DIR=%NBWRAPPER_DIR%\..

mkdir                                          "%PREFIX%\etc\jupyter"
xcopy /Y /E %MAIN_DIR%\jupyter_config_dir\*    "%PREFIX%\etc\jupyter"

mkdir                             "%PREFIX%\Scripts"
xcopy /Y %NBWRAPPER_DIR%\bin\*    "%PREFIX%\Scripts"
