# Configuration file for ipython-notebook.

c = get_config()

#------------------------------------------------------------------------------
# MappingKernelManager configuration
#------------------------------------------------------------------------------

# The name of the default kernel to start
c.MappingKernelManager.default_kernel_name = 'auto'

# Remove native kernel from wakari-compute
from jupyter_client import kernelspec
kernels = set(kernelspec.find_kernel_specs().keys())

try:
    kernels.remove("python2")
except KeyError as e:
    kernels.remove("python3")

c.KernelSpecManager.whitelist = kernels

c.NotebookApp.server_extensions.append('ipyparallel.nbextension')
