from pathlib import Path
import tempfile
import unittest
import os

from workers.core.utils.files import (
    safe_filename,
    build_visualization_filename,
    cleanup_old_files,
    read_upload_bytes_async,
)


class FileUtilsTests(unittest.TestCase):
    def test_safe_filename_strips_paths(self):
        assert safe_filename('../../etc/passwd') == 'passwd'
        assert safe_filename('..\\..\\windows\\system32') == 'system32'

    def test_safe_filename_defaults(self):
        assert safe_filename('') == 'upload.bin'
        assert safe_filename('..') == 'upload.bin'

    def test_build_visualization_filename_is_safe(self):
        filename = build_visualization_filename('../evil.pdf', token='abc')
        assert filename == 'visualization_evil_abc.jpg'

    def test_cleanup_old_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            old_file = tmp_path / 'old.txt'
            new_file = tmp_path / 'new.txt'
            old_file.write_text('old')
            new_file.write_text('new')

            # Set old file mtime to far past
            old_time = 1
            new_time = 10**10
            old_file.touch()
            new_file.touch()
            old_file.chmod(0o600)
            new_file.chmod(0o600)
            os.utime(old_file, (old_time, old_time))
            os.utime(new_file, (new_time, new_time))

            removed = cleanup_old_files(tmp_path, max_age_seconds=100)
            assert removed == 1
            assert not old_file.exists()
            assert new_file.exists()


class UploadSizeTests(unittest.IsolatedAsyncioTestCase):
    async def test_read_upload_bytes_async_enforces_limit(self):
        class DummyFile:
            def __init__(self, data):
                self._data = data
            async def read(self):
                return self._data

        data = b'a' * 5
        with self.assertRaises(ValueError):
            await read_upload_bytes_async(DummyFile(data), max_bytes=4)

    async def test_read_upload_bytes_async_accepts_limit(self):
        class DummyFile:
            def __init__(self, data):
                self._data = data
            async def read(self):
                return self._data

        data = b'a' * 4
        content = await read_upload_bytes_async(DummyFile(data), max_bytes=4)
        assert content == data


if __name__ == '__main__':
    unittest.main()
