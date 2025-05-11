import os
import yaml
from pyprojroot import here
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings
from langchain_mistralai import MistralAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

class PrepareVectorDB:

    def __init__(self,
                 doc_dir: str,
                 chunk_size: int,
                 chunk_overlap: int,
                 embedding_model: str,
                 vectordb_dir: str,
                 collection_name: str,
                 doc_name: str) -> None:
        self.doc_dir = doc_dir
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.collection_name = collection_name
        self.doc_name = doc_name

    def run(self):

        if not os.path.exists(self.vectordb_dir):
            os.makedirs(self.vectordb_dir)
            docs = [PyPDFLoader(self.doc_dir).load_and_split()]
            docs_list = [item for sublist in docs for item in sublist]
            text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
                chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap
            )
            doc_splits = text_splitter.split_documents(docs_list)
            vectordb = Chroma.from_documents(
                documents=doc_splits,
                collection_name=self.collection_name,
                embedding=MistralAIEmbeddings(model=self.embedding_model, api_key=str(os.getenv("MISTRAL_API_KEY"))),
                persist_directory=str(self.vectordb_dir), 
            )
            print(f"vector db for {self.doc_name} is created")
        else:
            print(f"vector db for {self.doc_name} already exists.")


class InitRAGTool:

    def __init__(self, embedding_model: str, vectordb_dir: str, k: int, collection_name: str) -> None:
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.k = k
        self.collection_name = collection_name
        self.vectordb = Chroma(
            embedding_function=MistralAIEmbeddings(model=self.embedding_model, api_key=str(os.getenv("MISTRAL_API_KEY"))),
            persist_directory=str(self.vectordb_dir),
            collection_name=self.collection_name,
        )

        