from __future__ import annotations

import asyncio
from typing import Awaitable, Callable, TypeVar

T = TypeVar("T")


async def with_timeout(coro: Awaitable[T], timeout: float | None) -> T:
    if timeout is None:
        return await coro
    return await asyncio.wait_for(coro, timeout=timeout)


async def retry_async(fn: Callable[[], Awaitable[T]], retries: int = 0, delay: float = 0.0) -> T:
    last_exc: Exception | None = None
    attempts = max(0, retries) + 1

    for attempt in range(attempts):
        try:
            return await fn()
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if attempt < attempts - 1 and delay > 0:
                await asyncio.sleep(delay)

    assert last_exc is not None
    raise last_exc
