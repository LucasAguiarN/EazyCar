const API_BASE = "http://localhost:5000";

document.getElementById("btn_logout").addEventListener("click", () => {
  localStorage.removeItem("token_funcionario");
  window.location.href = "../pages/Funcionário/login.html";
});

function getToken() {
  return localStorage.getItem("token_funcionario");
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    alert("Você precisa estar logado como funcionário para acessar.");
    window.location.href = "../pages/Funcionário/login.html";
    return null;
  }
  return token;
}

function statusToPt(status) {
  const map = { Active: "Ativa", "Em Uso": "Em Uso", "Concluído": "Concluída" };
  return map[status] || status;
}

function statusClass(status) {
  if (status === "Concluído") return "tag tag-available";
  if (status === "Em Uso")    return "tag tag-rented";
  if (status === "Active")    return "tag tag-maintenance";
  return "tag";
}

function formatBRL(value) {
  return "R$ " + Number(value).toFixed(2).replace(".", ",");
}

async function gerarRelatorio(event) {
  event.preventDefault();

  const token = requireAuth();
  if (!token) return;

  const dataInicio = document.getElementById("data_inicio").value;
  const dataFim    = document.getElementById("data_fim").value;

  if (!dataInicio || !dataFim) {
    alert("Informe o período completo.");
    return;
  }

  const resultSection = document.getElementById("resultado");
  resultSection.innerHTML = "<p>Carregando...</p>";

  try {
    const resp = await fetch(
      `${API_BASE}/relatorios/receitas?data_inicio=${dataInicio}&data_fim=${dataFim}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let json;
    try {
      json = await resp.json();
    } catch {
      throw new Error(`Erro ${resp.status} do servidor.`);
    }

    if (!resp.ok) throw new Error(json.mensagem || "Erro ao gerar relatório.");

    renderRelatorio(json);
  } catch (e) {
    resultSection.innerHTML = `<p style="color:red">${e.message}</p>`;
  }
}

function renderRelatorio(data) {
  const { resumo, reservas } = data;

  const porStatus = resumo.por_status;
  const statusHtml = Object.entries(porStatus)
    .map(([s, qtd]) => `<span class="${statusClass(s)}" style="margin-right:.4rem">${statusToPt(s)}: ${qtd}</span>`)
    .join("");

  const linhas = reservas.length === 0
    ? `<tr><td colspan="10" style="text-align:center;color:#888">Nenhuma reserva no período.</td></tr>`
    : reservas.map((r) => `
      <tr>
        <td>${r.id}</td>
        <td>${r.cliente_nome}</td>
        <td>${r.veiculo_nome}</td>
        <td>${r.veiculo_placa}</td>
        <td>${r.data_retirada}</td>
        <td>${r.data_devolucao}</td>
        <td>${r.local_retirada}</td>
        <td>${r.local_devolucao}</td>
        <td>${formatBRL(r.valor_total)}</td>
        <td><span class="${statusClass(r.status)}">${statusToPt(r.status)}</span></td>
      </tr>`).join("");

  document.getElementById("resultado").innerHTML = `
    <div class="stats" style="margin-bottom:1.5rem">
      <article class="stat">
        <div class="stat-title">Receita Total</div>
        <div class="stat-value">${formatBRL(resumo.receita_total)}</div>
      </article>
      <article class="stat">
        <div class="stat-title">Total de Reservas</div>
        <div class="stat-value">${resumo.total_reservas}</div>
      </article>
      <article class="stat">
        <div class="stat-title">Ticket Médio</div>
        <div class="stat-value">${formatBRL(resumo.ticket_medio)}</div>
      </article>
    </div>

    <div class="panel-card" style="margin-bottom:1rem;padding:.75rem 1rem">
      <strong>Por status:</strong>&nbsp;${statusHtml || "—"}
    </div>

    <div class="panel-card table-wrap">
      <table class="vehicles-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Veículo</th>
            <th>Placa</th>
            <th>Retirada</th>
            <th>Devolução</th>
            <th>Local Retirada</th>
            <th>Local Devolução</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();

  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDiaMes = hoje.slice(0, 7) + "-01";
  document.getElementById("data_inicio").value = primeiroDiaMes;
  document.getElementById("data_fim").value = hoje;

  document.getElementById("form_relatorio").addEventListener("submit", gerarRelatorio);
});
