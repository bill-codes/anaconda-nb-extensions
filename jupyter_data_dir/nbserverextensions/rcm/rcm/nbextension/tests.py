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


    def _get(self, url, expect_code=200, **kw):
        url = url_path_join(self.base_url(), url)
        data = {
            'path': self.notebook_path
        }
        data.update(kw)
        r = requests.get(url, data=data)
        self.assertEqual(r.status_code, expect_code)
        return r

    def _post(self, url, expect_code=200, **kw):
        url = url_path_join(self.base_url(), url)
        data = {
            'path': self.notebook_path
        }
        data.update(kw)
        r = requests.post(url, data=data)
        self.assertEqual(r.status_code, expect_code)
        return r


    def test_revision(self):
        """
        Basic first test of the /rcm/revision endpoint
        """
        r = self._get('/rcm/revision')
        self.assertTrue(len(r.text) == handlers.SHA_LENGTH)
        self.assertTrue(r.text.isalnum())


    def test_log(self):
        """
        Basic first test of the /rcm/log endpoint
        """
        r = self._get('/rcm/log')

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

        # commit should create a new revision
        new_rev = self._get('/rcm/revision').text
        self.assertNotEqual(old_rev, new_rev)

        # commit message and rev should appear in the most recent log entry
        r = self._get('/rcm/log')
        entry = r.text.splitlines()[0]
        self.assertIn(msg, entry)
        self.assertIn(new_rev, entry)

        # make another commit
        r = self._post('/rcm/commit', message='Second commit')

        # now do a checkout of the previous revision
        self._post('/rcm/checkout', rev=new_rev)

        # and make sure it worked
        current_rev = self._get('/rcm/revision').text
        self.assertEqual(current_rev, new_rev)


    def test_bad_get(self):
        """
        Try to GET from POST-only endpoints
        """
        r = self._get('/rcm/commit',   expect_code=405, message='commit message')
        r = self._get('/rcm/checkout', expect_code=405, rev='abcd123')


    def test_non_notebook(self):
        """
        Provide a path that is not an .ipynb file
        """
        path = os.path.join(temp_dir, 'not_a_notebook.txt')
        r = self._get('/rcm/revision', expect_code=404, path=path)


    def test_nonexistent(self):
        """
        Provide a path that does not exist
        """
        path = os.path.join(temp_dir, '__nonexistent_file__.ipynb')
        r = self._get('/rcm/revision', expect_code=404, path=path)
