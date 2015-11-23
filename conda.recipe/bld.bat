mkdir "%PREFIX%\etc\jupyter"
xcopy /E jupyter_config_dir\* "%PREFIX%\etc\jupyter"

mkdir "%PREFIX%\share\jupyter"
xcopy /E jupyter_data_dir\* "%PREFIX%\share\jupyter"

mkdir "%PREFIX%\bin"
xcopy bin\* "%PREFIX%\Scripts"
