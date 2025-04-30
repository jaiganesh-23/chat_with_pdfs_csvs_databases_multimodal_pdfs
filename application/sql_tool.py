from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain_mistralai import ChatMistralAI


class InitSQLTool:

    def __init__(self, sqldb_dir: str) -> None:
        self.sql_agent_llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct", temperature=0)
        self.db = SQLDatabase.from_uri(f"sqlite:///{sqldb_dir}")
        self.sql_query_template = """
            You are a data analyst at a company. You are interacting with a user who is asking you questions about the company's database.
            Based on the table schema below, write a SQLITE query that would answer the user's question.
    
            <SCHEMA>{schema}</SCHEMA>
    
            Write only the SQLITE query and nothing else. Do not wrap the SQLITE query in any other text, not even backticks.
            
            For example:
            Question: which 3 artists have the most tracks?
            SQL Query: SELECT ArtistId, COUNT(*) as track_count FROM Track GROUP BY ArtistId ORDER BY track_count DESC LIMIT 3;
            Question: Name 10 artists
            SQL Query: SELECT Name FROM Artist LIMIT 10;

            Your turn:
            
            Question: {question}
            SQL Query:
        """
        self.sql_query_prompt = ChatPromptTemplate.from_template(self.sql_query_template)
        self.sql_query_chain = RunnablePassthrough.assign(schema=self.get_schema) | self.sql_query_prompt | self.sql_agent_llm | StrOutputParser()
    
    def get_schema(self,_) -> str:
        table_info = self.db.get_table_info()
        #print(f"Table Info: {table_info}")
        return table_info
        

