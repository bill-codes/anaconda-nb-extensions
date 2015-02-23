@echo off
set BIN="%PREFIX%\bin"
set EXECPY="%BIN%\anaconda-notebook"
set EXECBATCH="%BIN\anaconda-notebook.bat"
set ETC="%PREFIX%/etc"

mkdir %BIN%
mkdir %ETC%

xcopy "%RECIPE_DIR%\..\ipython_config" "%ETC%\ipython_dir"
copy "%RECIPE_DIR%\..\anaconda-notebook" $%BIN%\
copy "%RECIPE_DIR%\..\anaconda-notebook.bat" %BIN%\
