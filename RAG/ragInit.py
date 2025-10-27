# build_rag_index_light.py
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sklearn.feature_extraction.text import TfidfVectorizer
from annoy import AnnoyIndex
import os
import pickle
import numpy as np

INDEX_PATH = os.path.join(os.path.dirname(__file__), "annoy_index")
DOC_PATH = os.path.join(os.path.dirname(__file__), "cat-facts.txt")
VECTOR_DIM = 1000  # size of TF-IDF vector

def build_index():
    loader = TextLoader(DOC_PATH, encoding="utf-8")
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    texts = [chunk.page_content for chunk in chunks]

    # 🔹 Lightweight TF-IDF embeddings
    vectorizer = TfidfVectorizer(max_features=VECTOR_DIM)
    vectors = vectorizer.fit_transform(texts).toarray()

    # 🔹 Annoy index for nearest neighbor search
    annoy_index = AnnoyIndex(VECTOR_DIM, metric='angular')
    for i, vec in enumerate(vectors):
        annoy_index.add_item(i, vec.astype(np.float32))
    annoy_index.build(10)  # 10 trees for small dataset

    os.makedirs(INDEX_PATH, exist_ok=True)
    annoy_index.save(os.path.join(INDEX_PATH, "index.ann"))
    with open(os.path.join(INDEX_PATH, "texts.pkl"), "wb") as f:
        pickle.dump(texts, f)
    with open(os.path.join(INDEX_PATH, "vectorizer.pkl"), "wb") as f:
        pickle.dump(vectorizer, f)

    print("✅ Lightweight RAG index built and saved to:", INDEX_PATH)

if __name__ == "__main__":
    build_index()
