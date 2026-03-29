from .data_base import db

class Funcionario(db.Model):

    __tablename__ = 'funcionarios'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    celular = db.Column(db.String(50), nullable=False)
    cargo = db.Column(db.String(50), nullable=False)

    def para_dicionario(self):
        dados = {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'email': self.email,
            'celular': self.celular,
            'cargo': self.cargo
        }
        return dados