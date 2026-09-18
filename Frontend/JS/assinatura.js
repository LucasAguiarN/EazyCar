document.addEventListener("DOMContentLoaded", carregarAssinatura);

async function carregarAssinatura() {
    const token = localStorage.getItem("token_cliente");

    if (!token) {
        alert("Você precisa estar logado para acessar sua assinatura.");
        window.location.href = "login.html";
        return;
    }

    const statusContainer = document.getElementById("status_assinatura");

    try {
        const request = await fetch(`${API_BASE}/assinaturas/minha`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const resposta = await request.json();

        if (request.ok && resposta.assinatura && resposta.assinatura.status === "Ativa") {
            mostrarAssinatura(resposta.assinatura);
            return;
        }

        statusContainer.innerHTML = `
            <h3 style="color: #666;">Você ainda não possui uma assinatura ativa.</h3>
            <p style="margin-top: 10px;">Escolha um dos planos acima para utilizar reservas por assinatura.</p>
        `;
        alterarBotoesPlanos(true);
    } catch (error) {
        console.error("Erro ao consultar assinatura:", error);
        statusContainer.innerHTML = `<p style="color: red;">Não foi possível consultar sua assinatura.</p>`;
    }
}

function mostrarAssinatura(assinatura) {
    const statusContainer = document.getElementById("status_assinatura");
    const renovacao = assinatura.renovacao_automatica !== false;

    statusContainer.innerHTML = `
        <h3 style="color: green;">✓ Assinatura Ativa</h3>
        <p style="margin-top: 15px;"><strong>Plano:</strong> ${assinatura.plano}</p>
        <p><strong>Valor:</strong> R$ ${Number(assinatura.valor_mensal).toFixed(2).replace(".", ",")}</p>
        <p><strong>Início:</strong> ${formatarData(assinatura.data_inicio)}</p>
        <p><strong>Validade atual:</strong> ${formatarData(assinatura.data_fim)}</p>
        <p><strong>Renovação automática:</strong> ${renovacao ? "Ativada" : "Cancelada"}</p>
        ${renovacao ? `
            <button class="btn-find-cars" style="margin: 20px auto 0;" onclick="cancelarRenovacao()">
                Cancelar renovação automática
            </button>
        ` : ""}
    `;

    alterarBotoesPlanos(false);
}

function alterarBotoesPlanos(exibir) {
    document.querySelectorAll(".car-type-card > .btn-find-cars").forEach(botao => {
        botao.style.display = exibir ? "block" : "none";
    });
}

async function criarAssinatura(plano) {
    const token = localStorage.getItem("token_cliente");
    if (!token) {
        alert("Você precisa estar logado para assinar.");
        window.location.href = "login.html";
        return;
    }

    const valores = { "Essencial": "299,90", "Plus": "499,90", "Premium": "799,90" };
    if (!valores[plano]) {
        alert("Plano inválido.");
        return;
    }

    if (!confirm(`Deseja contratar o Plano ${plano} EazyCar por R$ ${valores[plano]} com duração de 30 dias e renovação automática?`)) {
        return;
    }

    try {
        const request = await fetch(`${API_BASE}/assinaturas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ plano, duracao_dias: 30 })
        });
        const resposta = await request.json();
        alert(resposta.mensagem || (request.ok ? "Assinatura realizada com sucesso!" : "Não foi possível realizar a assinatura."));
        if (request.ok) carregarAssinatura();
    } catch (error) {
        console.error("Erro ao criar assinatura:", error);
        alert("Falha de conexão com a API.");
    }
}

async function cancelarRenovacao() {
    const token = localStorage.getItem("token_cliente");
    if (!token || !confirm("Deseja cancelar a renovação automática? O plano continuará ativo até o vencimento atual.")) {
        return;
    }

    try {
        const request = await fetch(`${API_BASE}/assinaturas/cancelar-renovacao`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const resposta = await request.json();
        alert(resposta.mensagem || "Operação concluída.");
        if (request.ok) carregarAssinatura();
    } catch (error) {
        console.error("Erro ao cancelar renovação:", error);
        alert("Falha de conexão com a API.");
    }
}

function formatarData(data) {
    if (!data) return "-";
    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
