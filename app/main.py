import os

from flask import Flask
try:
    from flask_cors import CORS
except ImportError:
    CORS = None
from app.database import init_db as _database_schema
from app.routes.home import home_route
from app.routes.transaction_routes import transaction_bp
from app.routes.recurring_routes import recurring_bp

app = Flask(__name__)
if CORS:
    allowed_origins = [
        origin.strip()
        for origin in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    CORS(app, origins=allowed_origins)

app.register_blueprint(home_route)
app.register_blueprint(transaction_bp)
app.register_blueprint(recurring_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=False)