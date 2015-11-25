import io
import json
import os
import requests

from tempfile import NamedTemporaryFile
from notebook.utils import url_path_join
from notebook.tests.launchnotebook import NotebookTestBase

import handlers


class TestLocker(NotebookTestBase):
    @classmethod
    def setup_class(cls):
        NotebookTestBase.setup_class()
        handlers.load_jupyter_server_extension(cls.notebook)

    def test_whoami(self):
        import getpass
        url = url_path_join(self.base_url(), 'whoami')
        r = requests.get(url)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.text, getpass.getuser())

    def test_non_notebook(self):
        url = url_path_join(self.base_url(), 'lock')
        r = requests.get(url, params={'path': '/not_a_notebook.txt'})
        self.assertEqual(r.status_code, 404)

        r = requests.post(url, data={'path': '/not_a_notebook.txt', 'user': 'anybody'})
        self.assertEqual(r.status_code, 404)

    def test_nonexistent(self):
        url = url_path_join(self.base_url(), 'lock')
        r = requests.get(url, params={'path': '/__nonexistent_file__.ipynb'})
        self.assertEqual(r.status_code, 404)

        r = requests.post(url, data={'path': '/__nonexistent_file__.ipynb', 'user': 'anybody'})
        self.assertEqual(r.status_code, 404)

    def test_lock(self):
        with NamedTemporaryFile(suffix='.ipynb') as f:
            url = url_path_join(self.base_url(), 'lock')

            r = requests.get(url, params={'path': f.name})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.text, '')

            # lock
            r = requests.post(url, data={'path': f.name, 'user': 'me'})
            self.assertEqual(r.status_code, 200)

            r = requests.get(url, params={'path': f.name})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.text, 'me')

            # unlock
            r = requests.post(url, data={'path': f.name, 'user': ''})
            self.assertEqual(r.status_code, 200)

            r = requests.get(url, params={'path': f.name})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.text, '')
