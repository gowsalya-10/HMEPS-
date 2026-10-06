from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from db import init_app, get_db
import routes

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app)

# Init DB
init_app(app)

# Register Blueprints
app.register_blueprint(routes.bp, url_prefix='/api')

@app.route('/')
def index():
    return jsonify({"message": "Welcome to HMEPS API"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
