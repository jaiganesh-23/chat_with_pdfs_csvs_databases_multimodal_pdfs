from flask import Flask
from flask_session import Session


def create_app():
    app = Flask(__name__)
    app.secret_key = "hello"

    with app.app_context():
        # Importing components of app
        from .views import view

        app.register_blueprint(view, url_prefix="/")

    app.config["SESSION_PERMANENT"] = False     
    app.config["SESSION_TYPE"] = "filesystem"     
    Session(app)
    
    return app
