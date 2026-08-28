from flask import Blueprint, jsonify

home_route = Blueprint('home', __name__, url_prefix='')

@home_route.route("/")
def home():
    return jsonify({
        "name": "C-Money API",
        "frontend": "Execute o Vite na pasta frontend para abrir a interface.",
    })