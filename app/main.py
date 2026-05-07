from flask import Flask, render_template
from app.routes.home import home_route
from app.routes.transaction_routes import transaction_bp
from app.routes.recurring_routes import recurring_bp

app = Flask(__name__)

app.register_blueprint(home_route)
app.register_blueprint(transaction_bp)
app.register_blueprint(recurring_bp)

if __name__ == "__main__":
    app.run(debug=True)