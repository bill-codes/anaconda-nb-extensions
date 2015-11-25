
# Locker Extension

This extension provides a cooperative locking service. This is useful
when multiple notebook servers run from the same underlying filesystem.
The locker extension will create a .lock file alongside the notebook,
indicating which user currently holds the file lock.

Tests for the back-end are in tests.py and can be run with
```
python -m nose -v tests
```



