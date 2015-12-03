import requests
import os

from tempfile import NamedTemporaryFile, mkdtemp
from notebook.utils import url_path_join
from notebook.tests.launchnotebook import NotebookTestBase

# run test in a temporary directory
temp_dir = mkdtemp()
os.chdir(temp_dir)
from . import handlers


class TestRCM(NotebookTestBase):
    notebook_path = None

    @classmethod
    def setup_class(cls):
        NotebookTestBase.setup_class()
        handlers.load_jupyter_server_extension(cls.notebook)
        cls.notebook_file = NamedTemporaryFile(dir=temp_dir, suffix='.ipynb')
        cls.notebook_path = cls.notebook_file.name


    def _get(self, url, **kw):
        url = url_path_join(self.base_url(), url)
        data = {
            'path': self.notebook_path
        }
        data.update(kw)
        return requests.get(url, data=data)


    def _post(self, url, **kw):
        url = url_path_join(self.base_url(), url)
        data = {
            'path': self.notebook_path
        }
        data.update(kw)
        return requests.post(url, data=data)


    def test_revision(self):
        """
        Basic first test of the /rcm/revision endpoint
        """
        r = self._get('/rcm/revision')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(len(r.text) == handlers.SHA_LENGTH)
        self.assertTrue(r.text.isalnum())


    def test_log(self):
        """
        Basic first test of the /rcm/log endpoint
        """
        r = self._get('/rcm/log')
        self.assertEqual(r.status_code, 200)
        for line in r.text.splitlines():
            # each line starts with '* ' and the commit hash
            self.assertTrue(line.startswith('* '))
            self.assertTrue(line[2:2+handlers.SHA_LENGTH].isalnum())


    def test_commit(self):
        """
        Perform a commit and verify revision and log change appropriately
        """
        old_rev = self._get('/rcm/revision').text

        msg = 'My commit message'
        r = self._post('/rcm/commit', message=msg)
        self.assertEqual(r.status_code, 200)

        # commit should create a new revision
        new_rev = self._get('/rcm/revision').text
        self.assertNotEqual(old_rev, new_rev)

        # commit message and rev should appear in the most recent log entry
        r = self._get('/rcm/log')
        entry = r.text.splitlines()[0]
        self.assertIn(msg, entry)
        self.assertIn(new_rev, entry)


    def test_bad_get(self):
        """
        Try to GET from POST-only endpoints
        """
        r = self._get('/rcm/commit', message='commit message')
        self.assertEqual(r.status_code, 405)

        r = self._get('/rcm/checkout', rev='abcd123')
        self.assertEqual(r.status_code, 405)


    def test_non_notebook(self):
        """
        Provide a path that is not an .ipynb file
        """
        path = os.path.join(temp_dir, 'not_a_notebook.txt')
        r = self._get('/rcm/revision', path=path)
        self.assertEqual(r.status_code, 404)


    def test_nonexistent(self):
        """
        Provide a path that does not exist
        """
        path = os.path.join(temp_dir, '__nonexistent_file__.ipynb')
        r = self._get('/rcm/revision', path=path)
        self.assertEqual(r.status_code, 404)
