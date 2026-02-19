import os

from arq.connections import RedisSettings


class WorkerSettings:
    functions = ["workers.tasks.process_pdf"]
    redis_settings = RedisSettings(
        host=os.getenv("REDIS_HOST", "redis-plumber"),
        port=int(os.getenv("REDIS_PORT", "6379")),
    )
    concurrency = 1
    job_timeout = 600
