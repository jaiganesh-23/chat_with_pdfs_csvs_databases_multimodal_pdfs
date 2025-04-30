from application import create_app
from pyprojroot import here
from dotenv import load_dotenv
import os

app = create_app()


if __name__ == "__main__":
    load_dotenv(here(".env"))
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
    os.environ["MISTRALAI_API_KEY"] = os.getenv("MISTRALAI_API_KEY")
    os.environ["LANGSMITH_API_KEY"] = os.getenv("LANGSMITH_API_KEY")
    os.environ["HF_TOKEN"] = os.getenv("HF_TOKEN")
    os.environ["LANGSMITH_TRACING"] = os.getenv("LANGSMITH_TRACING")
    os.environ["LANGSMITH_ENDPOINT"] = os.getenv("LANGSMITH_ENDPOINT")
    os.environ["LANGSMITH_PROJECT"] = os.getenv("LANGSMITH_PROJECT")
    os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
    os.environ["MISTRAL_API_KEY"] = os.getenv("MISTRALAI_API_KEY")

    app.run(debug=True, host="0.0.0.0", port=5000)
