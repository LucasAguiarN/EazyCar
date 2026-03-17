from Models import db

class Cliente(db.Model):

    __tablename__ = 'clientes'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(100), nullable=False)
    celular = db.Column(db.String(50), nullable=False)
    cep = db.Column(db.String(9), nullable=False)
    endereco = db.Column(db.String(100), nullable=False)
    numero = db.Column(db.Integer, nullable=False)
    complemento = db.Column(db.String(100), nullable=True)

    def para_dicionario(self):
        dados = {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'email': self.email,
            'senha': self.senha,
            'celular': self.celular,
            'cep': self.cep,
            'endereco' : self.endereco,
            'numero' : self.numero,
            'complemento' : self.complemento
        }
        return dados