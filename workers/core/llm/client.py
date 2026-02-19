import os
from typing import Any, List, Type

import instructor
from ollama import AsyncClient


class OllamaInstructorClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.ollama = AsyncClient(host=self.base_url)
        self.client = instructor.patch(self.ollama, mode=instructor.Mode.OLLAMA)

    async def extract(self, model: str, messages: List[dict], response_model: Type[Any]) -> Any:
        return await self.client.chat.completions.create(
            model=model,
            messages=messages,
            response_model=response_model,
            temperature=0.0,
        )
