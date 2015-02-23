@echo off
set BIN="%PREFIX%\bin"
set EXECPY="%BIN%\anaconda-notebook"
set EXECBATCH="%BIN\anaconda-notebook.bat"
set ETC="%PREFIX%/ETC"

mkdir %BIN%
mkdir %ETC%

xcopy "%RECIPE_DIR%\ipython_config" "%ETC%\ipython_dir"
copy anaconda-notebook $%BIN%\
copy anaconda-notebook.bat %BIN%\
