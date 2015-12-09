#!/usr/bin/env python
import subprocess
import sys

import logging
logger = logging.getLogger(__name__)

def main(executable):

    cmd = [executable] + sys.argv[1:]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                         stdout=sys.stdout,
                         stderr=sys.stderr)
    p.stdin.close()
    p.wait()

if __name__ == '__main__':
    main(sys.executable)
