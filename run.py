from flask import Flask, jsonify, make_response
from Models.data_base import iniciar_db, db

def create_app():

    app = Flask(__name__)

    iniciar_db(app)
    
    with app.app_context():
        db.create_all()

    @app.route('/', methods=['GET'])
    def health():
        return make_response(jsonify({
            "mensagem": "API - OK; Docker - Up",
        }), 200)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)