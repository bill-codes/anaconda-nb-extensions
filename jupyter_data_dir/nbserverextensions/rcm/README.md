
# RCM Extension

This extension provides a basic revision control feature based on git.

All endpoints require a path parameter, which must point to an existing
.ipynb file.

Supported endpoints are:

* `GET /rcm/revision`: get the current revision string (SHA hash)
* `GET /rcm/log`: get the revision history
* `GET /rcm/diff`: get a flattened diff of the notebook JSON.
    Optionally provide parameters `sha1` and `sha2` to get a diff between those revisions.
* `POST /rcm/commit`: commit the current version. This will always overwrite, never merge.
    Required parameter `message` is the commit message.
* `POST /rcm/checkout`: check out a specified revision.
    Required parameter `rev` is the revision (hash) to check out.

Tests for the back-end are in tests.py and can be run with
```
PYTHONPATH=./nbextension python -m nose -v tests
```
