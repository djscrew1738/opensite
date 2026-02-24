import asyncio
import unittest

from workers.core.utils.async_utils import with_timeout, retry_async


class LlmClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_with_timeout_raises(self):
        async def slow():
            await asyncio.sleep(0.05)
            return 'ok'

        with self.assertRaises(TimeoutError):
            await with_timeout(slow(), timeout=0.01)

    async def test_retry_async_eventually_succeeds(self):
        attempts = {'count': 0}

        async def flaky():
            attempts['count'] += 1
            if attempts['count'] < 3:
                raise ValueError('fail')
            return 'ok'

        result = await retry_async(flaky, retries=2, delay=0)
        assert result == 'ok'
        assert attempts['count'] == 3


if __name__ == '__main__':
    unittest.main()
