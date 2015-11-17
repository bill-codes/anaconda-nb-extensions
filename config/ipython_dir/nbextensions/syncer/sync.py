import argparse
import os
from os.path import exists, join, dirname
import subprocess
import sys
import locale
import IPython
import warnings
## DO NOT PRINT ANYTHING IN THIS FILE - we process stdout!!

parser = argparse.ArgumentParser()
parser.add_argument("-p","--path", type=str, help="your custom ipython_dir")
args = parser.parse_args()

encoding = locale.getdefaultlocale()[1]
if encoding is None:
    warnings.warn("Default locale detected is (None, None), setting enconding to UTF-8.")
    encoding = 'UTF-8'

# get all the envs from conda info -e
p = subprocess.Popen(["conda", "info", "-e"], stdout=subprocess.PIPE)
info_out, info_err = p.communicate()
outs = info_out.decode(encoding).split("\n")[2:-2]

# make a dict containing all the envs available
envs = {}
for i, e in enumerate(outs):
    envs[outs[i].split(" ")[0]] = outs[i].split(" ")[-1]

# locate the ipython kernels dir
if args.path:
    # from notebookwrapper.py
    kernels_dir = args.path
    from_startup = True
else:
    # from syncer extension
    ip = IPython.get_ipython()
    ipython_dir, profile = os.path.split(ip.profile_dir.location)
    kernels_dir = os.path.join(ipython_dir, "kernels")
    from_startup = False

CONTENT_TEMPLATE = """{
 "display_name": "%s",
 "name": "%s",
 "language": "python",
 "argv": [
  "%s",
  "-c",
  "from IPython.kernel.zmq.kernelapp import main; main()",
  "-f",
  "{connection_file}"
 ],
 "codemirror_mode": {
  "version": 2,
  "name": "python"
 }
}"""

# create the customized kernel.json files for each env
def write_kernel(content, directory):
    try:
        os.makedirs(directory)
    except OSError as e:
        pass
    kernel_file = join(directory, 'kernel.json')
    if exists(kernel_file):
        with open(kernel_file) as f:
            old_content = f.read()
        if old_content == content:
            return False
    with open(kernel_file, "w+") as f:
        f.write(content)
    return True

def add_auto_kernel():
    name = 'auto'
    executable = join(sys.prefix, 'bin', 'kernel_wrapper.py')
    content = CONTENT_TEMPLATE % (name, name, executable)
    envs_dir = os.path.join(kernels_dir, name)
    return write_kernel(content, envs_dir)

def add_kernels():
    changed = []
    for key in envs.keys():
        # create the kernel folder
        prefix = envs[key]
        ipython = join(prefix, 'bin', 'ipython')
        python = join(prefix, 'bin', 'python')
        envs_dir = os.path.join(kernels_dir, key)
        if not exists(ipython):
            ipython = join(prefix, 'bin', 'ipython3')
            python = join(prefix, 'bin', 'python3')
        if not exists(ipython):
            continue
        content = CONTENT_TEMPLATE % (key, key, python)
        changed.append(write_kernel(content, envs_dir))
    return any(changed)

if from_startup:
    auto_changed = add_auto_kernel()
else:
    auto_changed = False
changed = add_kernels()
if changed or auto_changed:
    print ('changed')
else:
    print ('notchanged')
