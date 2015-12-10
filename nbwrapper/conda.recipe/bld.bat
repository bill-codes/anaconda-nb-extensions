"%PYTHON%" setup.py install
if errorlevel 1 exit 1

mkdir                            "%PREFIX%\etc\jupyter"
xcopy /E jupyter_config_dir\*    "%PREFIX%\etc\jupyter"

mkdir          "%PREFIX%\Scripts"
xcopy bin\*    "%PREFIX%\Scripts"
