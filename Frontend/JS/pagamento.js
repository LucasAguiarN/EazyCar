const urlParams = new URLSearchParams(window.location.search);
const reservaId = urlParams.get('reserva_id');

document.addEventListener('DOMContentLoaded', async () => {
    const tokenCliente = localStorage.getItem('token_cliente');
    if (!tokenCliente) {
        window.location.href = "Cliente/login.html";
        return;
    }

    if (!reservaId) {
        alert("Nenhuma reserva especificada para pagamento.");
        window.location.href = "minhas_reservas.html";
        return;
    }
    document.getElementById('mensagemBloqueio').style.display = 'none';
    document.getElementById('conteudoPagamento').style.display = 'block';

    carregarDetalhesReserva();
    inicializarValidacaoCartao();
});

// Alterna entre abas PIX e Cartão
function alternarTab(metodo) {
    const btnPix = document.querySelector('.payment-tabs button:nth-child(1)');
    const btnCartao = document.querySelector('.payment-tabs button:nth-child(2)');
    const secaoPix = document.getElementById('secaoPix');
    const secaoCartao = document.getElementById('secaoCartao');

    if (metodo === 'pix') {
        btnPix.classList.add('active');
        btnCartao.classList.remove('active');
        secaoPix.classList.add('active');
        secaoCartao.classList.remove('active');
    } else {
        btnCartao.classList.add('active');
        btnPix.classList.remove('active');
        secaoCartao.classList.add('active');
        secaoPix.classList.remove('active');
    }
}

// Carrega os dados da reserva para exibir na tela
async function carregarDetalhesReserva() {
    try {
        const token_cliente = localStorage.getItem('token_cliente');
        const resumoDiv = document.getElementById('resumoReserva');
        const response = await fetch(`${API_BASE}/reservas/minhas`, {
            headers: {
                'Authorization': `Bearer ${token_cliente}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const reservas = await response.json();
            const reserva = reservas.find(r => String(r.id) === String(reservaId));

            if (reserva) {
                const valorFormatado = reserva.valor_total ? parseFloat(reserva.valor_total).toFixed(2) : '0.00';
                resumoDiv.innerHTML = `
                    <p><strong>Veículo:</strong> ${reserva.veiculo_nome || 'Veículo #' + reserva.veiculo_id}</p>
                    <p><strong>Período:</strong> ${reserva.data_retirada} até ${reserva.data_devolucao}</p>
                    <p><strong>Valor Total:</strong> <span style="color: #ff8c00; font-size: 18px; font-weight: bold;">R$ ${valorFormatado}</span></p>
                    <p><strong>Status atual:</strong> <span class="tag tag-cancelled">${reserva.status}</span></p>
                `;
            } else {
                resumoDiv.innerHTML = `<p style="color: red;">Reserva #${reservaId} não encontrada no seu histórico.</p>`;
            }
        } else {
            resumoDiv.innerHTML = `<p style="color: red;">Erro ao buscar dados da reserva (Status: ${response.status}).</p>`;
        }
    } catch (err) {
        console.error("Erro ao carregar reserva:", err);
        document.getElementById('resumoReserva').innerHTML = `<p style="color: red;">Erro de conexão com o servidor.</p>`;
    }
}

// Validação reativa do formulário de cartão
function inicializarValidacaoCartao() {
    const form = document.getElementById('formCartao');
    if (!form) return;

    const btnPagar = document.getElementById('btnPagarCartao');
    const inputs = form.querySelectorAll('input[required]');

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            let allValid = true;
            inputs.forEach(i => {
                if (!i.value.trim()) allValid = false;
            });
            btnPagar.disabled = !allValid;
        });
    });
}

// Executa o pagamento via PIX
async function pagarComPix() {
    const codigoPix = document.getElementById('pixCopiaCola').innerText;

    try {
        await navigator.clipboard.writeText(codigoPix);
        alert("Código PIX copiado com sucesso! Simulando compensação bancária...");
    } catch (err) {
        console.error("Erro ao copiar PIX:", err);
    }

    await enviarRequisicaoPagamento('PIX');
}

// Executa o pagamento via Cartão
async function pagarComCartao(event) {
    event.preventDefault();
    await enviarRequisicaoPagamento('CARTAO_CREDITO');
}

// Envia a requisição POST para o backend processar o pagamento
async function enviarRequisicaoPagamento(metodo) {
    const token_cliente = localStorage.getItem('token_cliente');

    try {
        const response = await fetch(`${API_BASE}/reservas/${reservaId}/pagar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token_cliente}`
            },
            body: JSON.stringify({ metodo_pagamento: metodo })
        });

        const resultado = await response.json();

        if (response.ok) {
            alert("Pagamento aprovado com sucesso! Sua reserva foi ativada.");
            window.location.href = "minhas_reservas.html";
        } else {
            alert("Erro ao processar pagamento: " + (resultado.erro || resultado.mensagem || "Erro desconhecido"));
        }
    } catch (err) {
        console.error("Erro na requisição de pagamento:", err);
        alert("Erro de conexão ao processar pagamento. Verifique o console do navegador.");
    }
}

// Botão de cancelar a reserva
async function cancelarReservaPagamento() {
    if (!confirm("Deseja realmente cancelar esta reserva e liberar o veículo?")) return;

    const token_cliente = localStorage.getItem('token_cliente');

    try {
        const response = await fetch(`${API_BASE}/reservas/${reservaId}/cancelar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token_cliente}`
            },
            body: JSON.stringify({ motivo: "Desistência no pagamento" })
        });

        if (response.ok) {
            alert("Reserva cancelada com sucesso.");
            window.location.href = "minhas_reservas.html";
        } else {
            const data = await response.json();
            alert("Erro ao cancelar: " + (data.mensagem || "Erro desconhecido"));
        }
    } catch (err) {
        console.error("Erro ao cancelar:", err);
    }
}