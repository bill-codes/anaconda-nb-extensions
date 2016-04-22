# manually build a working environment with all the extensions
# you should already have checked out all the extensions as neighbors of
# anaconda-nb-extensions

conda env remove -yn anaconda-nb-extensions || echo "fresh env!"

conda env update
source activate anaconda-nb-extensions

cd ../nb_anacondacloud
python setup.py develop
jupyter nbextension install nb_anacondacloud --py --sys-prefix --symlink
jupyter nbextension enable nb_anacondacloud --py --sys-prefix
jupyter serverextension enable nb_anacondacloud --py --sys-prefix

cd ../nb_conda
python setup.py develop
jupyter nbextension install nb_conda --py --sys-prefix --symlink
jupyter nbextension enable nb_conda --py --sys-prefix
jupyter serverextension enable nb_conda --py --sys-prefix

cd ../nb_conda_kernels
python setup.py develop
jupyter serverextension enable nb_conda --py --sys-prefix

cd ../nbpresent
python setup.py develop
jupyter nbextension install nbpresent --py --sys-prefix --symlink
jupyter nbextension enable nbpresent --py --sys-prefix
jupyter serverextension enable nbpresent --py --sys-prefix

# just for reference
conda env export
jupyter nbextension list
jupyter serverextension list
