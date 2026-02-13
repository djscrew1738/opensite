#!/usr/bin/env python3
"""CLI helper used by the backend API to enqueue plumbing extraction jobs."""
import asyncio
import argparse
import os
from urllib.parse import urlparse

from arq import create_pool
from arq.connections import RedisSettings

DEFAULT_REDIS_URL = os.getenv("REDIS_URL", "redis://redis-plumber:6379")


def parse_redis_url(url: str) -> tuple:
    parsed = urlparse(url)
    if parsed.scheme not in {"redis", "rediss"}:
        raise ValueError(f"Unsupported Redis URL scheme: {parsed.scheme}")

    host = parsed.hostname or "redis-plumber"
    port = parsed.port or 6379
    password = parsed.password
    use_ssl = parsed.scheme == "rediss"
    return host, port, password, use_ssl


async def enqueue(pdf_id: str, redis_url: str, timeout: int) -> str:
    host, port, password, _ = parse_redis_url(redis_url)
    redis_settings = RedisSettings(host=host, port=port, password=password)
    redis = await create_pool(redis_settings)
    try:
        job = await redis.enqueue_job("process_pdf", pdf_id=pdf_id, timeout=timeout)
        print(job.job_id)
        return job.job_id
    finally:
        await redis.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Enqueue a plumbing extraction job")
    parser.add_argument("--pdf-id", required=True, help="Name of the uploaded PDF file")
    parser.add_argument(
        "--redis-url",
        default=os.getenv("REDIS_URL", DEFAULT_REDIS_URL),
        help="Redis URL used by the worker",
    )
    parser.add_argument("--timeout", type=int, default=600, help="Maximum job duration in seconds")
    args = parser.parse_args()

    asyncio.run(enqueue(args.pdf_id, args.redis_url, args.timeout))


if __name__ == "__main__":
    main()
