import requests
from notebook.utils import url_path_join
from notebook.tests.launchnotebook import NotebookTestBase

import handlers


class TestHelloWorld(NotebookTestBase):
    @classmethod
    def setup_class(cls):
        NotebookTestBase.setup_class()
        handlers.load_jupyter_server_extension(cls.notebook)

    def test_hello(self):
        url = url_path_join(self.base_url(), 'hello')
        r = requests.get(url)
        self.assertEqual(r.status_code, 200)
