# backend/baseAgent.py
# Small wrapper that creates a model, tools list and ReactAgent.
from agentpro import ReactAgent, create_model
import os
from typing import Optional, Sequence


class BaseAgent:
    """Container for a model, tools list and a ReactAgent instance.

    This class instantiates the underlying model and ReactAgent so callers
    can create multiple independent agents if needed. It also supports
    a module-level default instance for backwards compatibility.

    Args:
        provider: model provider name (default: "openai").
        model_name: model identifier (default: "gpt-4.1-nano").
        api_key: API key string. If None, pulls from OPENAI_API_KEY env var.
        tools: optional sequence of tools to pass to ReactAgent.
    """

    def __init__(
        self,
        provider: str = "openai",
        model_name: str = "gpt-4.1-nano",
        api_key: Optional[str] = None,
        tools: Optional[Sequence] = None,
        custom_system_prompt: Optional[str] = None,
        max_iterations: Optional[int] = 20
    ) -> None:
        if api_key is None:
            api_key = os.getenv("OPENAI_API_KEY", None)
        self.model = create_model(provider=provider, model_name=model_name, api_key=api_key)
        # Ensure tools is a list for mutability if callers want to append
        self.tools = list(tools) if tools is not None else []
        self.agent = ReactAgent(model=self.model,
                                tools=self.tools,
                                max_iterations=max_iterations,
                                custom_system_prompt=custom_system_prompt)


__all__ = ["BaseAgent"]
