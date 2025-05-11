from flask import Blueprint
from flask import Flask, render_template, url_for, session, request, redirect, flash, jsonify
from werkzeug.utils import secure_filename
from pyprojroot import here
import os
import json
from .sql_tool import InitSQLTool
from .rag_tool import InitRAGTool, PrepareVectorDB
from .multimodal_rag_tool import InitMultiModalRAG, LoadMultiModalRAG
from .agent_backend import State, BasicToolNode, route_tools, plot_agent_schema
from pyprojroot import here
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START
from langchain_core.tools import tool
from langchain_mistralai import ChatMistralAI
from langchain_groq import ChatGroq
from langsmith import traceable
import time
import pandas as pd
from sqlalchemy import create_engine, inspect
import uuid


view = Blueprint("views", __name__)
final_graphs = {}
final_graphs_last_active = {}
thread_id = 999
pdf_file = 0
csv_file = 0
db_file = 0

def clear_final_graphs():
    global final_graphs
    global final_graphs_last_active
    keys_to_be_deleted = []
    for key, value in final_graphs_last_active.items():
        if time.time() - value > 3600:
            keys_to_be_deleted.append(key)

    for key in keys_to_be_deleted:
        final_graphs.pop(key)
        final_graphs_last_active.pop(key)

@view.route("/", methods=["GET"])
def home():
    return render_template("home.html", **{"session": session, "active": "home"})

@view.route("/chat", methods=["GET"])
def chat():
    return render_template("chat.html", **{"session": session, "active": "chat"})

@view.route("/upload_pdf", methods=["POST"])
def upload_pdf():
    global pdf_file
    if 'files[]' not in request.files:
        resp = jsonify({'message' : 'No file part in the request'})
        resp.status_code = 400 
        return resp
    
    if "files" not in session:
        file_dict = json.loads(request.form.get("file"))
        file_dict["fileName"] = "pdf_file"+str(pdf_file)+".pdf"
        session["files"] = [file_dict]
    else:
        file_dict = json.loads(request.form.get("file"))
        file_dict["fileName"] = "pdf_file"+str(pdf_file)+".pdf"
        temp = session["files"]
        temp.append(file_dict)
        session["files"] = temp

    files = request.files.getlist('files[]')
    for file in files:
        filename = secure_filename(file.filename)
        new_filename = "pdf_file"+str(pdf_file)+".pdf"
        file_path = os.path.join(here("downloads/pdfs"), new_filename)
        file.save(file_path)
 
    pdf_file = pdf_file + 1

    return jsonify({"message": "PDF file uploaded successfully."}), 200

@view.route("/upload_csv", methods=["POST"])
def upload_csv():
    global csv_file
    if 'files[]' not in request.files:
        resp = jsonify({'message' : 'No file part in the request'})
        resp.status_code = 400 
        return resp
    
    if "files" not in session:
        file_dict = json.loads(request.form.get("file"))
        file_dict["fileName"] = "csv_file"+str(csv_file)+"."+file_dict["oldFileName"].split(".")[-1]
        session["files"] = [file_dict]
    else:
        file_dict = json.loads(request.form.get("file"))
        file_dict["fileName"] = "csv_file"+str(csv_file)+"."+file_dict["oldFileName"].split(".")[-1]
        temp = session["files"]
        temp.append(file_dict)
        session["files"] = temp

    files = request.files.getlist('files[]')
    for file in files:
        filename = secure_filename(file.filename)
        new_filename = "csv_file"+str(csv_file)+"."+filename.split(".")[-1]
        file_path = os.path.join(here("downloads/csvs xlsxs"), new_filename)
        file.save(file_path)

    csv_file = csv_file + 1
 
    return jsonify({"message": "CSV file uploaded successfully."}), 200

@view.route("/upload_db", methods=["POST"])
def upload_db():
    global db_file
    if 'files[]' not in request.files:
        resp = jsonify({'message' : 'No file part in the request'})
        resp.status_code = 400 
        return resp
    
    if "files" not in session:
        file_dict = json.loads(request.form.get("file"))
        file_dict["fileName"] = "db_file"+str(db_file)+"."+file_dict["oldFileName"].split(".")[-1]
        session["files"] = [file_dict]
    else:
        file_dict = json.loads(request.form.get("file"))
        file_dict["fileName"] = "db_file"+str(db_file)+"."+file_dict["oldFileName"].split(".")[-1]
        temp = session["files"]
        temp.append(file_dict)
        session["files"] = temp

    files = request.files.getlist('files[]')
    for file in files:
        filename = secure_filename(file.filename)
        new_filename = "db_file"+str(db_file)+"."+filename.split(".")[-1]
        file_path = os.path.join(here("downloads/dbs"), new_filename)
        file.save(file_path)

    db_file = db_file + 1
 
    return jsonify({"message": "DB file uploaded successfully."}), 200

@view.route("/get_files", methods=["GET"])
def get_files():
    if "files" in session:
        files = session["files"]
    else:
        files = []

    return jsonify({"files": files}), 200

@view.route("/prepare_chatbot", methods=["POST"])
def prepare_chatbot():
    global final_graphs
    global final_graphs_last_active
    global thread_id
    thread_id = thread_id + 1
    agent_tools = []

    clear_final_graphs()
    if "files" not in session:
        resp = jsonify({"message": "No files uploaded."})
        resp.status_code = 400 
        return resp
    
    files = session["files"]

    for index, file in enumerate(files):
        if file["fileType"] == "db":
            func_string = """
from langchain_core.tools import tool
from application.sql_tool import InitSQLTool
from pyprojroot import here

question="question"
@tool
def tool"""+f"""{index}"""+f"""(query: str) -> str:
    "Query the {file["oldFileName"]} database. {file["fileDescription"]}. Input should be search query in natural language."
    agent = InitSQLTool(
            sqldb_dir=here(f"downloads/dbs/{file['fileName']}")
        )
    sql_query = agent.sql_query_chain.invoke({"{question: query}"})
    return agent.db.run(sql_query)
"""
            code = compile(func_string, "<string>", "exec")
            code_namespace = {"__name__": "__main__"}
            exec(code, code_namespace)
            agent_tools.append(code_namespace["tool"+f"{index}"])
        if file["fileType"] == "pdf":
            preparedb_instance = PrepareVectorDB(
                doc_dir=here(f"downloads/pdfs/{file['fileName']}"),
                chunk_size=500,
                chunk_overlap=100,
                embedding_model="mistral-embed",
                vectordb_dir=here(f"vectordbs/{file['fileName']}"),
                collection_name=f"{file['fileName']}-chroma",
                doc_name=file["fileName"]
            )
            preparedb_instance.run()
            time.sleep(5)
            InitMultiModalRAG(doc_dir=here(f"downloads/pdfs/{file['fileName']}"), filename=file['fileName'])
            func_string = f"""
from langchain_core.tools import tool
from langsmith import traceable
from application.rag_tool import PrepareVectorDB, InitRAGTool
from application.multimodal_rag_tool import InitMultiModalRAG, LoadMultiModalRAG
from pyprojroot import here
import chromadb

@tool
def tool"""+f"""{index}"""+f"""(query: str) -> str:
    "Query the {file["oldFileName"]} file. {file["fileDescription"]}. Input should be search query in natural language."
    chromadb.api.client.SharedSystemClient.clear_system_cache()
    rag_tool = InitRAGTool(
        embedding_model="mistral-embed",
        vectordb_dir=here(f"vectordbs/{file['fileName']}"),
        k=5,
        collection_name=f"{file['fileName']}-chroma"
    )
    multimodal_rag_tool = LoadMultiModalRAG(doc_dir=here(f"downloads/pdfs/{file['fileName']}"), filename="{file['fileName']}")
    docs = rag_tool.vectordb.similarity_search(query, k=5)
    rag_tool_result = "\\n\\n".join([doc.page_content for doc in docs])
    multimodal_rag_tool_result = multimodal_rag_tool.chain_with_sources.invoke(query)
    final_result = multimodal_rag_tool_result['response'] + "\\n\\n\\n\\n" + rag_tool_result
    return final_result
"""
            code = compile(func_string, "<string>","exec")
            code_namespace = {"__name__": "__main__"}
            exec(code, code_namespace)
            time.sleep(5)
            agent_tools.append(code_namespace["tool"+f"{index}"])

        if file["fileType"] == "csv/xlsx":
            filename_without_extension = file["fileName"].split(".")[0]
            file_extension = file["fileName"].split(".")[-1]
            if file_extension == "csv":
                db_path = here(f"downloads/csvs xlsxs dbs/{filename_without_extension}.db")
                sqlite_db_path = f"sqlite:///{db_path}"
                engine = create_engine(sqlite_db_path)
                df = pd.read_csv(here(f"downloads/csvs xlsxs/{file['fileName']}"))
                df.to_sql(filename_without_extension, engine, if_exists="replace", index=False)

            if file_extension == "xlsx":
                db_path = here(f"downloads/csvs xlsxs dbs/{filename_without_extension}.db")
                sqlite_db_path = f"sqlite:///{db_path}"
                engine = create_engine(sqlite_db_path)
                df = pd.read_excel(here(f"downloads/csvs xlsxs/{file['fileName']}"))
                df.to_sql(filename_without_extension, engine, if_exists="replace", index=False)

            func_string = """
from langchain_core.tools import tool
from application.sql_tool import InitSQLTool
from pyprojroot import here

question="question"
@tool
def tool"""+f"""{index}"""+f"""(query: str) -> str:
    "Query the {filename_without_extension} database. {file["fileDescription"]}. Input should be search query in natural language."
    agent = InitSQLTool(sqldb_dir=here(f"downloads/csvs xlsxs dbs/{filename_without_extension}.db"))
    sql_query = agent.sql_query_chain.invoke({"{question: query}"})
    return agent.db.run(sql_query)
"""
            code = compile(func_string, "<string>", "exec")
            code_namespace = {"__name__": "__main__"}
            exec(code, code_namespace)
            agent_tools.append(code_namespace["tool"+f"{index}"])

    primary_llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct", temperature=0)
    graph_builder = StateGraph(State)
    primary_llm_with_tools = primary_llm.bind_tools(tools=agent_tools)

    def chatbot(state: State):
        """Executes the primary language model with tools bound and returns the generated message."""
        try:
            # Attempt to invoke the primary LLM with tools
            return {"messages": [primary_llm_with_tools.invoke(state["messages"])]}
        except Exception as e:
            print(e)
            # Handle errors and return a user-friendly message
            error_message = f"An unexpected error occurred while processing your request, please try again later."
            return {"messages": [("assistant", error_message)]}
        
    graph_builder.add_node("chatbot", chatbot)
    tool_node = BasicToolNode(tools=agent_tools)
    graph_builder.add_node("tools", tool_node)
    graph_builder.add_conditional_edges(
        "chatbot",
        route_tools,
        {"tools": "tools", "__end__": "__end__"},
    )
    graph_builder.add_edge("tools", "chatbot")
    graph_builder.add_edge(START, "chatbot")
    memory = MemorySaver()
    graph = graph_builder.compile(checkpointer=memory)
    graph_id = uuid.uuid4()
    final_graphs[graph_id] = graph
    final_graphs_last_active[graph_id] = time.time()
    session["graph_id"] = graph_id
    

    resp = jsonify({"message": "Chatbot Ready"})
    resp.status_code = 200
    return resp
    
@view.route("/get_response", methods=["POST"])
def get_response():
    global final_graphs
    global final_graphs_last_active
    global thread_id
    message = request.get_json().get("message")
    if "message" not in session:
        session["message"] = [{"role": "user", "message": message}]
    else:
        temp = session["message"]
        temp.append({"role": "user", "message": message})
        session["message"] = temp

    if "graph_id" not in session:
        resp = jsonify({"message": "Chatbot not ready."})
        temp = session["message"]
        temp.append({"role": "assistant", "message": "Chatbot not ready."})
        session["message"] = temp
        resp.status_code = 400 
        return resp

    config = {"configurable": {"thread_id": thread_id}}
    final_graph = final_graphs[session["graph_id"]]
    events = final_graph.stream(
            {"messages": [("user", message)]}, config, stream_mode="values"
        )
    
    for event in events:
        event["messages"][-1].pretty_print()
    final_graphs_last_active[session["graph_id"]] = time.time()

    response = event["messages"][-1].content

    temp = session["message"]
    temp.append({"role": "assistant", "message": response})
    session["message"] = temp

    resp = jsonify({"message": response})
    resp.status_code = 200
    return resp

@view.route("/get_messages", methods=["GET"])
def get_messages():
    if "message" in session:
        messages = session["message"]
    else:
        messages = []

    return jsonify({"messages": messages}), 200

@view.route("/toggle_sidebar", methods=["POST"])
def toggle_sidebar():
    if "sidebar" not in session:
        session["sidebar"] = True
    else:
        if session["sidebar"] == True:
            session["sidebar"] = False
        elif session["sidebar"] == False:
            session["sidebar"] = True
    
    resp = jsonify({"message": "Sidebar Toggled"})
    resp.status_code = 200
    return resp