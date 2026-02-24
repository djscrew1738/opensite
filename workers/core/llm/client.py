import os
from typing import Any, List, Type

import instructor
from ollama import AsyncClient

from workers.core.utils.async_utils import retry_async, with_timeout


class OllamaInstructorClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.timeout = float(os.getenv("OLLAMA_TIMEOUT", "120"))
        self.retries = int(os.getenv("OLLAMA_RETRIES", "1"))
        self.retry_delay = float(os.getenv("OLLAMA_RETRY_DELAY", "0.5"))
        self.ollama = AsyncClient(host=self.base_url)
        self.client = instructor.patch(self.ollama, mode=instructor.Mode.OLLAMA)

    async def extract(self, model: str, messages: List[dict], response_model: Type[Any]) -> Any:
        async def call():
            return await with_timeout(
                self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    response_model=response_model,
                    temperature=0.0,
                ),
                timeout=self.timeout,
            )

        return await retry_async(call, retries=self.retries, delay=self.retry_delay)
