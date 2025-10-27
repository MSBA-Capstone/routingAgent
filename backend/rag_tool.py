#Create custom tool for agentPro
from agentpro.tools import Tool
from typing import Any

class RagTool(Tool):
    name: str = "Local RAG Tool"  # Human-readable name for the tool (used in documentation and debugging)
    description: str = "Contains most up to date information on everything cats, its use should be prioritized if question is related to cats."  # Brief summary explaining the tool's functionality for agent
    action_type: str = "local_rag"  # Unique identifier for the tool; lowercase with underscores for agent; avoid spaces, digits, special characters
    input_format: str = "A string query"  # Instruction on what kind of input the tool expects with example

    def run(self, input_text: Any) -> str:
            # Load Annoy index and TF-IDF vectorizer, perform RAG retrieval
            import os
            import pickle
            import numpy as np
            from annoy import AnnoyIndex

            INDEX_PATH = os.path.join(os.path.dirname(__file__), "..", "RAG", "annoy_index")
            annoy_index = AnnoyIndex(1000, metric='angular')
            annoy_index.load(os.path.join(INDEX_PATH, "index.ann"))
            with open(os.path.join(INDEX_PATH, "texts.pkl"), "rb") as f:
                texts = pickle.load(f)
            with open(os.path.join(INDEX_PATH, "vectorizer.pkl"), "rb") as f:
                vectorizer = pickle.load(f)

            # Embed the query
            query_vec = vectorizer.transform([input_text]).toarray()[0].astype(np.float32)
            idxs = annoy_index.get_nns_by_vector(query_vec, 4)
            results = [texts[i] for i in idxs]
            return "\n".join(results)
