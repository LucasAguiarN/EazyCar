from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func

from Backend.Models.data_base import db
from Backend.Models.reserva import Reserva
from Backend.Models.assinatura import Assinatura
from Backend.Models.veiculo import Veiculo
from Backend.Models.cliente import Cliente
from Backend.Models.pontos import MovimentacaoPontos
from Backend.Models.avaliacao import Avaliacao
from Backend.Models.pagamento import Pagamento

from Backend.decorators import cliente_required, funcionario_required
from Backend.fidelidade import pontos_por_categoria, reais_equivalentes
from Backend.Controllers.assinatura_controller import atualizar_vencimento


class ReservaController:

    @cliente_required
    @staticmethod
    def criar_reserva():
        cliente_id = int(get_jwt_identity())
        dados = request.get_json(silent=True) or {}

        print("DADOS RECEBIDOS:", dados, flush=True)

        veiculo_id = dados.get("veiculo_id")
        data_retirada_str = dados.get("data_retirada")
        data_devolucao_str = dados.get("data_devolucao")
        local_retirada = dados.get("local_retirada")
        local_devolucao = dados.get("local_devolucao")
        tipo_reserva = dados.get("tipo_reserva", "comum")

        print(
            "VALIDACAO >>>",
            veiculo_id,
            data_retirada_str,
            data_devolucao_str,
            local_retirada,
            local_devolucao,
            flush=True
        )

        if (
            not veiculo_id
            or not data_retirada_str
            or not data_devolucao_str
            or not local_retirada
            or not local_devolucao
        ):
            return jsonify({
                "mensagem": "Dados incompletos!"
            }), 400

        try:
            data_retirada = datetime.strptime(
                data_retirada_str,
                "%Y-%m-%d"
            ).date()

            data_devolucao = datetime.strptime(
                data_devolucao_str,
                "%Y-%m-%d"
            ).date()

        except ValueError:
            return jsonify({
                "mensagem": "Formato de data inválido."
            }), 400

        dias = (data_devolucao - data_retirada).days

        if dias <= 0:
            return jsonify({
                "mensagem": "A devolução deve ser posterior à retirada."
            }), 400

        if tipo_reserva not in ["comum", "assinatura"]:
            return jsonify({
                "mensagem": "Tipo de reserva inválido."
            }), 400

        if tipo_reserva == "assinatura" and dias < 30:
            return jsonify({
                "mensagem": "Reservas por assinatura devem possuir duração mínima de 30 dias."
            }), 400

        veiculo = Veiculo.query.filter_by(
            id=veiculo_id,
            status="Available"
        ).first()

        if not veiculo:
            return jsonify({
                "mensagem": "Veículo indisponível ou não encontrado."
            }), 404

        if tipo_reserva == "assinatura":

            assinatura = Assinatura.query.filter_by(
                cliente_id=cliente_id,
                status="Ativa"
            ).first()

            if not assinatura:
                return jsonify({
                    "mensagem": "Você não possui uma assinatura ativa."
                }), 403

            atualizar_vencimento(assinatura)

            if assinatura.status != "Ativa":
                return jsonify({
                    "mensagem": "Sua assinatura está expirada."
                }), 403

            if data_retirada < assinatura.data_inicio:
                return jsonify({
                    "mensagem": "A retirada não pode ser anterior ao início da assinatura."
                }), 400

            if (
                assinatura.data_fim
                and assinatura.data_fim < data_devolucao
            ):
                if assinatura.renovacao_automatica:
                    while assinatura.data_fim < data_devolucao:
                        assinatura.data_fim += timedelta(days=30)
                    db.session.commit()
                else:
                    return jsonify({
                        "mensagem": (
                            "A reserva ultrapassa o vencimento da assinatura "
                            "e a renovação automática está desativada."
                        )
                    }), 400

            categorias_por_plano = {
                        "Essencial": ["Econômico"],
                        "Plus": ["Econômico", "Intermediário"],
                        "Premium": ["Econômico", "Intermediário", "Premium"]
            

            }

            categorias_permitidas = categorias_por_plano.get(
                assinatura.plano,
                []
            )

            if veiculo.categoria not in categorias_permitidas:
                return jsonify({
                    "mensagem": (
                        f"O plano {assinatura.plano} não permite "
                        f"reservas de veículos da categoria "
                        f"{veiculo.categoria}."
                    )
                }), 403

            valor_total = 0.0

        else:
            valor_total = dias * veiculo.valor_diaria

        try:
            nova_reserva = Reserva(
                cliente_id=cliente_id,
                veiculo_id=veiculo_id,
                local_retirada=local_retirada,
                local_devolucao=local_devolucao,
                data_retirada=data_retirada,
                data_devolucao=data_devolucao,
                valor_total=valor_total,
                tipo_reserva=tipo_reserva,
                status="Inactive"
            )

            db.session.add(nova_reserva)
            db.session.flush()

            novo_pagamento = Pagamento(
                reserva_id=nova_reserva.id,
                metodo_pagamento="pendente",
                status="Pendente",
                valor=valor_total,
                codigo_pix=None
            )
            db.session.add(novo_pagamento)

            veiculo.status = "Rented"

            db.session.commit()

            return jsonify({
                "mensagem": "Reserva realizada com sucesso! Realize o pagamento para ativá-la.",
                "reserva": nova_reserva.to_dict(),
                "reserva_id": nova_reserva.id
            }), 201

        except Exception as e:
            db.session.rollback()
            print("ERRO AO CRIAR RESERVA:", str(e), flush=True)
            return jsonify({
                "mensagem": "Erro interno ao processar reserva."
            }), 500


    @cliente_required
    @staticmethod
    def listar_minhas_reservas():
        cliente_id = int(get_jwt_identity())

        reservas = Reserva.query.filter_by(
            cliente_id=cliente_id
        ).order_by(
            Reserva.id.desc()
        ).all()

        reservas_avaliadas = {
            a.reserva_id
            for a in Avaliacao.query.filter_by(
                cliente_id=cliente_id
            ).all()
        }

        resultado = []

        for r in reservas:
            veiculo = Veiculo.query.filter_by(
                id=r.veiculo_id
            ).first()

            dados_reserva = r.to_dict()

            dados_reserva["avaliada"] = (
                r.id in reservas_avaliadas
            )

            if veiculo:
                dados_reserva["veiculo_nome"] = (
                    f"{veiculo.marca} {veiculo.modelo}"
                )

                dados_reserva["veiculo_placa"] = (
                    veiculo.placa
                )

                dados_reserva["veiculo_categoria"] = (
                    veiculo.categoria
                )

                dados_reserva["veiculo_imagem"] = (
                    veiculo.imagem
                )

            else:
                dados_reserva["veiculo_nome"] = (
                    "Veículo Indisponível"
                )

                dados_reserva["veiculo_placa"] = "---"
                dados_reserva["veiculo_categoria"] = None
                dados_reserva["veiculo_imagem"] = None

            resultado.append(dados_reserva)

        return jsonify(resultado), 200


    @cliente_required
    @staticmethod
    def check_in_reserva(reserva_id):
        cliente_id = int(get_jwt_identity())

        try:
            reserva = Reserva.query.filter_by(
                id=reserva_id,
                cliente_id=cliente_id
            ).first()

            if not reserva:
                return jsonify({
                    "mensagem":
                        "Reserva não encontrada ou acesso não autorizado."
                }), 404

            if reserva.status != "Active":
                return jsonify({
                    "mensagem": (
                        "Apenas reservas com status 'Active' "
                        "podem fazer check-in. "
                        f"Status atual: {reserva.status}"
                    )
                }), 400

            reserva.data_hora_check_in = datetime.now()
            reserva.status = "Em Uso"

            db.session.commit()

            return jsonify({
                "mensagem": "Check-in realizado com sucesso!",
                "reserva": reserva.to_dict()
            }), 200

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "mensagem":
                    f"Erro ao realizar check-in: {str(e)}"
            }), 500


    @cliente_required
    @staticmethod
    def cancelar_reserva(reserva_id):
        cliente_id = int(get_jwt_identity())
        dados = request.get_json(silent=True) or {}

        motivo = (dados.get("motivo") or "").strip()

        if len(motivo) > 255:
            return jsonify({
                "mensagem":
                    "O motivo do cancelamento deve ter no máximo 255 caracteres."
            }), 400

        try:
            reserva = Reserva.query.filter_by(
                id=reserva_id,
                cliente_id=cliente_id
            ).first()

            if not reserva:
                return jsonify({
                    "mensagem":
                        "Reserva não encontrada ou acesso não autorizado."
                }), 404

            if (
                reserva.status not in ["Active", "Inactive"]
                or reserva.data_hora_check_in is not None
            ):
                return jsonify({
                    "mensagem": (
                        "Apenas reservas sem check-in realizado "
                        "podem ser canceladas. "
                        f"Status atual: {reserva.status}"
                    )
                }), 400

            veiculo = Veiculo.query.get(reserva.veiculo_id)
            if veiculo:
                veiculo.status = "Available"

            reserva.status = "Cancelada"
            reserva.data_hora_cancelamento = datetime.now()
            reserva.motivo_cancelamento = motivo or None

            pagamento = Pagamento.query.filter_by(reserva_id=reserva.id).first()
            teve_reembolso = False

            if pagamento:
                if pagamento.status == "Aprovado":
                    pagamento.status = "Reembolsado"
                    teve_reembolso = True
                else:
                    pagamento.status = "Cancelado"

            db.session.commit()

            if teve_reembolso:
                mensagem_sucesso = "Reserva cancelada com sucesso! O reembolso do valor pago foi processado com sucesso."
            else:
                mensagem_sucesso = "Reserva cancelada com sucesso."

            return jsonify({
                "mensagem": mensagem_sucesso,
                "reembolsado": teve_reembolso
            }), 200

        except Exception:
            db.session.rollback()

            return jsonify({
                "mensagem": "Erro interno ao cancelar reserva."
            }), 500


    @cliente_required
    @staticmethod
    def check_out_reserva(reserva_id):
        cliente_id = int(get_jwt_identity())

        try:
            reserva = Reserva.query.filter_by(
                id=reserva_id,
                cliente_id=cliente_id
            ).first()

            if not reserva:
                return jsonify({
                    "mensagem":
                        "Reserva não encontrada ou acesso não autorizado."
                }), 404

            if reserva.status != "Em Uso":
                return jsonify({
                    "mensagem": (
                        "Apenas reservas em uso podem fazer check-out. "
                        f"Status atual: {reserva.status}"
                    )
                }), 400

            reserva.data_hora_check_out = datetime.now()
            reserva.status = "Concluído"

            veiculo = Veiculo.query.filter_by(
                id=reserva.veiculo_id
            ).first()

            if veiculo:
                veiculo.status = "Available"

            pontos_creditados = 0

            if reserva.pontos_ganhos is None:

                cliente = Cliente.query.filter_by(
                    id=cliente_id
                ).first()

                categoria = (
                    veiculo.categoria
                    if veiculo
                    else None
                )

                pontos_creditados = pontos_por_categoria(
                    categoria
                )

                reserva.pontos_ganhos = pontos_creditados

                if cliente:
                    cliente.pontos = (
                        cliente.pontos or 0
                    ) + pontos_creditados

                    veiculo_nome = (
                        f"{veiculo.marca} {veiculo.modelo}"
                        if veiculo
                        else "veículo"
                    )

                    categoria_txt = (
                        categoria or "Econômico"
                    )

                    db.session.add(
                        MovimentacaoPontos(
                            cliente_id=cliente_id,
                            reserva_id=reserva.id,
                            tipo="credito",
                            pontos=pontos_creditados,
                            descricao=(
                                f"Locação de {veiculo_nome} "
                                f"({categoria_txt})"
                            )
                        )
                    )

            db.session.commit()

            return jsonify({
                "mensagem":
                    "Check-out realizado com sucesso!",
                "reserva":
                    reserva.to_dict(),
                "pontos_ganhos":
                    pontos_creditados
                    or reserva.pontos_ganhos
                    or 0,
                "valor_em_reais":
                    reais_equivalentes(
                        pontos_creditados
                        or reserva.pontos_ganhos
                        or 0
                    )
            }), 200

        except Exception as e:
            db.session.rollback()

            return jsonify({
                "mensagem":
                    f"Erro ao realizar check-out: {str(e)}"
            }), 500


    @funcionario_required
    @staticmethod
    def relatorio_receitas():
        data_inicio_str = request.args.get(
            "data_inicio"
        )

        data_fim_str = request.args.get(
            "data_fim"
        )

        if not data_inicio_str or not data_fim_str:
            return jsonify({
                "mensagem":
                    "Parâmetros data_inicio e data_fim são obrigatórios."
            }), 400

        try:
            data_inicio = datetime.strptime(
                data_inicio_str,
                "%Y-%m-%d"
            ).date()

            data_fim = datetime.strptime(
                data_fim_str,
                "%Y-%m-%d"
            ).date()

        except ValueError:
            return jsonify({
                "mensagem":
                    "Formato de data inválido. Use YYYY-MM-DD."
            }), 400

        if data_fim < data_inicio:
            return jsonify({
                "mensagem":
                    "data_fim deve ser igual ou posterior a data_inicio."
            }), 400

        veiculo_id_str = (request.args.get("veiculo_id") or "").strip()
        categoria = (request.args.get("categoria") or "").strip()
        status = (request.args.get("status") or "").strip()
        tipo_reserva = (request.args.get("tipo_reserva") or "").strip()
        local_retirada = (request.args.get("local_retirada") or "").strip()

        veiculo_id = None

        if veiculo_id_str:
            try:
                veiculo_id = int(veiculo_id_str)
            except ValueError:
                return jsonify({
                    "mensagem":
                        "veiculo_id inválido."
                }), 400

        filtros_veiculo = []

        if veiculo_id is not None:
            filtros_veiculo.append(Veiculo.id == veiculo_id)

        if categoria:
            filtros_veiculo.append(Veiculo.categoria == categoria)

        filtros_reserva = list(filtros_veiculo)

        if status:
            filtros_reserva.append(Reserva.status == status)

        if tipo_reserva:
            filtros_reserva.append(
                func.lower(Reserva.tipo_reserva) == tipo_reserva.lower()
            )

        if local_retirada:
            filtros_reserva.append(Reserva.local_retirada == local_retirada)

        resultados = (
            db.session.query(Reserva, Veiculo)
            .join(Veiculo, Reserva.veiculo_id == Veiculo.id)
            .filter(
                Reserva.data_retirada >= data_inicio,
                Reserva.data_retirada <= data_fim,
                *filtros_reserva
            )
            .order_by(
                Reserva.data_retirada.asc()
            )
            .all()
        )

        receita_total = 0.0
        por_status: dict[str, int] = {}
        receita_por_categoria: dict[str, float] = {}
        receita_por_dia: dict[str, float] = {}
        lista = []

        total_canceladas = 0
        total_pagantes = 0

        for r, veiculo in resultados:


            if r.status == "Cancelada":
                total_canceladas += 1
            elif r.status != "Inactive":
                valor = r.valor_total or 0.0

                if (r.tipo_reserva or "").lower() == "comum":
                    total_pagantes += 1

                receita_total += valor

                nome_categoria = veiculo.categoria or "Sem categoria"
                receita_por_categoria[nome_categoria] = (
                    receita_por_categoria.get(nome_categoria, 0.0) + valor
                )

                dia = r.data_retirada.strftime("%Y-%m-%d")
                receita_por_dia[dia] = (
                    receita_por_dia.get(dia, 0.0) + valor
                )

            por_status[r.status] = (
                por_status.get(
                    r.status,
                    0
                ) + 1
            )

            lista.append({
                "id":
                    r.id,

                "veiculo_nome":
                    f"{veiculo.marca} {veiculo.modelo}",

                "categoria":
                    veiculo.categoria,

                "diarias":
                    (r.data_devolucao - r.data_retirada).days,

                "local_retirada":
                    r.local_retirada,

                "local_devolucao":
                    r.local_devolucao,

                "tipo_reserva":
                    r.tipo_reserva,

                "valor_total":
                    r.valor_total,

                "status":
                    r.status
            })

        total_reservas = len(lista)

        ticket_medio = (
            receita_total / total_pagantes
            if total_pagantes
            else 0.0
        )

        taxa_cancelamento = (
            total_canceladas / total_reservas * 100
            if total_reservas
            else 0.0
        )

        receita_periodo = []
        acumulado = 0.0
        dia_atual = data_inicio

        while dia_atual <= data_fim:
            chave = dia_atual.strftime("%Y-%m-%d")
            valor_dia = receita_por_dia.get(chave, 0.0)
            acumulado += valor_dia

            receita_periodo.append({
                "data": chave,
                "receita": round(valor_dia, 2),
                "acumulado": round(acumulado, 2)
            })

            dia_atual += timedelta(days=1)

        total_veiculos = (
            Veiculo.query
            .filter(*filtros_veiculo)
            .count()
        )

        dias_periodo = (data_fim - data_inicio).days + 1
        fim_exclusivo = data_fim + timedelta(days=1)

        reservas_no_periodo = (
            db.session.query(Reserva)
            .join(Veiculo, Reserva.veiculo_id == Veiculo.id)
            .filter(
                Reserva.status.notin_(["Cancelada", "Inactive"]),
                Reserva.data_retirada < fim_exclusivo,
                Reserva.data_devolucao > data_inicio,
                *filtros_reserva
            )
            .all()
        )

        dias_alugados = 0

        for r in reservas_no_periodo:
            inicio = max(r.data_retirada, data_inicio)
            fim = min(r.data_devolucao, fim_exclusivo)
            dias_alugados += max((fim - inicio).days, 0)

        capacidade = total_veiculos * dias_periodo

        taxa_ocupacao = (
            min(dias_alugados / capacidade * 100, 100.0)
            if capacidade
            else 0.0
        )

        return jsonify({
            "periodo": {
                "data_inicio": data_inicio_str,
                "data_fim": data_fim_str
            },

            "filtros": {
                "veiculo_id": veiculo_id,
                "categoria": categoria or None,
                "status": status or None,
                "tipo_reserva": tipo_reserva or None,
                "local_retirada": local_retirada or None
            },

            "resumo": {
                "total_reservas":
                    total_reservas,

                "total_canceladas":
                    total_canceladas,

                "receita_total":
                    round(
                        receita_total,
                        2
                    ),

                "ticket_medio":
                    round(
                        ticket_medio,
                        2
                    ),

                "taxa_cancelamento":
                    round(
                        taxa_cancelamento,
                        2
                    ),

                "taxa_ocupacao":
                    round(
                        taxa_ocupacao,
                        2
                    ),

                "dias_alugados":
                    dias_alugados,

                "total_veiculos":
                    total_veiculos,

                "por_status":
                    por_status
            },

            "receita_por_categoria": [
                {
                    "categoria": nome,
                    "receita": round(valor, 2)
                }
                for nome, valor in sorted(
                    receita_por_categoria.items(),
                    key=lambda item: item[1],
                    reverse=True
                )
                if valor > 0
            ],

            "receita_periodo":
                receita_periodo,

            "reservas":
                lista

        }), 200

    @funcionario_required
    @staticmethod
    def filtros_relatorio():
        veiculos = (
            Veiculo.query
            .order_by(Veiculo.marca, Veiculo.modelo)
            .all()
        )

        categorias = sorted({
            v.categoria for v in veiculos if v.categoria
        })

        locais = [
            local for (local,) in (
                db.session.query(Reserva.local_retirada)
                .distinct()
                .order_by(Reserva.local_retirada)
                .all()
            )
            if local
        ]

        return jsonify({
            "veiculos": [
                {
                    "id": v.id,
                    "nome": f"{v.marca} {v.modelo}",
                    "placa": v.placa
                }
                for v in veiculos
            ],

            "categorias": categorias,

            "status": ["Inactive", "Active", "Em Uso", "Concluído", "Cancelada"],

            "tipos_reserva": ["comum", "assinatura"],

            "locais_retirada": locais
        }), 200