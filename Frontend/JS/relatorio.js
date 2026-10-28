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
  const map = { Inactive: "Aguardando pagamento", Active: "Aguardando retirada", "Em Uso": "Em Uso", "Concluído": "Concluída", Cancelada: "Cancelada" };
  return map[status] || status;
}

function tipoToPt(tipo) {
  const map = { comum: "Comum", assinatura: "Assinatura" };
  return map[(tipo || "").toLowerCase()] || tipo || "—";
}

function statusClass(status) {
  if (status === "Concluído") return "tag tag-available";
  if (status === "Em Uso")    return "tag tag-rel-em-uso";
  if (status === "Active")    return "tag tag-rel-ativa";
  if (status === "Cancelada") return "tag tag-rel-cancelada";
  if (status === "Inactive")  return "tag tag-rel-aguardando";
  return "tag";
}

function formatBRL(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPct(value) {
  return Number(value).toFixed(1).replace(".", ",") + "%";
}

function formatDataBR(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

const CORES_CATEGORIA = {
  "Econômico": "#27b0a5",
  "Executivo": "#f28c1c",
  "SUV": "#0f172a",
  "Van": "#6366f1",
  "Sem categoria": "#94a3b8"
};
const CORES_EXTRAS = ["#e11d48", "#16a34a", "#ca8a04", "#0891b2", "#9333ea", "#be185d"];

let graficoCategoria = null;
let graficoPeriodo = null;
let ultimoRelatorio = null;
let categoriasCadastradas = [];

function corCategoria(nome) {
  if (CORES_CATEGORIA[nome]) return CORES_CATEGORIA[nome];

  const extras = categoriasCadastradas.filter((c) => !CORES_CATEGORIA[c]);
  const indice = extras.indexOf(nome);
  return CORES_EXTRAS[(indice >= 0 ? indice : extras.length) % CORES_EXTRAS.length];
}

function preencherSelect(id, opcoes) {
  const select = document.getElementById(id);
  opcoes.forEach(({ valor, texto }) => {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = texto;
    select.appendChild(option);
  });
}

async function carregarFiltros(token) {
  try {
    const resp = await fetch(`${API_BASE}/relatorios/filtros`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resp.ok) throw new Error();

    const filtros = await resp.json();
    categoriasCadastradas = filtros.categorias;

    preencherSelect("filtro_veiculo", filtros.veiculos.map((v) => ({ valor: v.id, texto: `${v.nome} (${v.placa})` })));
    preencherSelect("filtro_categoria", filtros.categorias.map((c) => ({ valor: c, texto: c })));
    preencherSelect("filtro_status", filtros.status.map((s) => ({ valor: s, texto: statusToPt(s) })));
    preencherSelect("filtro_tipo", filtros.tipos_reserva.map((t) => ({ valor: t, texto: tipoToPt(t) })));
    preencherSelect("filtro_local", filtros.locais_retirada.map((l) => ({ valor: l, texto: l })));
  } catch {
    document.getElementById("resultado").innerHTML =
      `<p style="color:red">Não foi possível carregar as opções de filtro.</p>`;
  }
}

function montarParametros() {
  const params = new URLSearchParams({
    data_inicio: document.getElementById("data_inicio").value,
    data_fim: document.getElementById("data_fim").value
  });

  const filtros = {
    veiculo_id: "filtro_veiculo",
    categoria: "filtro_categoria",
    status: "filtro_status",
    tipo_reserva: "filtro_tipo",
    local_retirada: "filtro_local"
  };

  Object.entries(filtros).forEach(([param, id]) => {
    const valor = document.getElementById(id).value;
    if (valor) params.append(param, valor);
  });

  return params;
}

async function gerarRelatorio(event) {
  if (event) event.preventDefault();

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
      `${API_BASE}/relatorios/receitas?${montarParametros().toString()}`,
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
    resultSection.innerHTML = `<p style="color:red">${escapeHtml(e.message)}</p>`;
  }
}

function limparFiltros() {
  ["filtro_veiculo", "filtro_categoria", "filtro_status", "filtro_tipo", "filtro_local"]
    .forEach((id) => { document.getElementById(id).value = ""; });
}

function renderRelatorio(data) {
  const { resumo, reservas } = data;
  ultimoRelatorio = data;

  // Reservas por assinatura são cobradas pelo plano mensal, não por reserva
  const soAssinatura = (data.filtros.tipo_reserva || "").toLowerCase() === "assinatura";
  const avisoAssinatura = `
        <div class="stat-value">Assinatura</div>
        <div class="stat-title">Cobrada pelo plano mensal</div>`;

  const linhas = reservas.length === 0
    ? `<tr><td colspan="9" style="text-align:center;color:#888">Nenhuma reserva no período.</td></tr>`
    : reservas.map((r) => `
      <tr>
        <td>${r.id}</td>
        <td>${escapeHtml(r.veiculo_nome)}</td>
        <td>${escapeHtml(r.categoria || "—")}</td>
        <td>${r.diarias}</td>
        <td>${escapeHtml(r.local_retirada)}</td>
        <td>${escapeHtml(r.local_devolucao)}</td>
        <td>${tipoToPt(r.tipo_reserva)}</td>
        <td>${r.status === "Cancelada" ? `<s>${formatBRL(r.valor_total)}</s>` : formatBRL(r.valor_total)}</td>
        <td><span class="${statusClass(r.status)}">${statusToPt(r.status)}</span></td>
      </tr>`).join("");

  document.getElementById("resultado").innerHTML = `
    <div class="stats" style="margin-bottom:1.5rem;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      <article class="stat">
        <div class="stat-title">Receita Total</div>
        ${soAssinatura ? avisoAssinatura : `<div class="stat-value">${formatBRL(resumo.receita_total)}</div>`}
      </article>
      <article class="stat">
        <div class="stat-title">Total de Reservas</div>
        <div class="stat-value">${resumo.total_reservas}</div>
      </article>
      <article class="stat">
        <div class="stat-title">Ticket Médio</div>
        ${soAssinatura ? avisoAssinatura : `<div class="stat-value">${formatBRL(resumo.ticket_medio)}</div>`}
      </article>
      <article class="stat">
        <div class="stat-title">Taxa de Ocupação</div>
        <div class="stat-value">${formatPct(resumo.taxa_ocupacao)}</div>
        <div class="stat-title">${resumo.dias_alugados} diárias de ${resumo.total_veiculos} veículo(s)</div>
      </article>
      <article class="stat">
        <div class="stat-title">Taxa de Cancelamento</div>
        <div class="stat-value">${formatPct(resumo.taxa_cancelamento)}</div>
        <div class="stat-title">${resumo.total_canceladas} de ${resumo.total_reservas} reserva(s)</div>
      </article>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;margin-bottom:1.5rem">
      <div class="panel-card">
        <strong>Receita por categoria</strong>
        <div style="position:relative;height:280px;margin-top:.75rem">
          <canvas id="grafico_categoria"></canvas>
          <p id="sem_dados_categoria" style="display:none;text-align:center;color:#888;padding-top:110px">${soAssinatura ? "Assinaturas são cobradas pelo plano mensal." : "Sem receita no período."}</p>
        </div>
      </div>
      <div class="panel-card">
        <strong>Receita no período</strong>
        <div style="position:relative;height:280px;margin-top:.75rem">
          <canvas id="grafico_periodo"></canvas>
          <p id="aviso_periodo" style="display:none;text-align:center;color:#888;padding-top:110px">Assinaturas são cobradas pelo plano mensal.</p>
        </div>
      </div>
    </div>

    <div class="panel-card table-wrap">
      <div style="display:flex;justify-content:flex-end;margin-bottom:.5rem">
        <button class="btn btn-inline" type="button" id="btn_exportar_csv" ${reservas.length === 0 ? "disabled" : ""}>Exportar CSV</button>
      </div>
      <table class="vehicles-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Veículo</th>
            <th>Categoria</th>
            <th>Diárias</th>
            <th>Local Retirada</th>
            <th>Local Devolução</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;

  document.getElementById("btn_exportar_csv").addEventListener("click", exportarCsv);

  renderGraficos(data, soAssinatura);
}

function exportarCsv() {
  if (!ultimoRelatorio || ultimoRelatorio.reservas.length === 0) return;

  // ";" e vírgula decimal para abrir direto no Excel em português
  const campo = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
  const valorCsv = (valor) => Number(valor || 0).toFixed(2).replace(".", ",");

  const cabecalho = ["#", "Veículo", "Categoria", "Diárias", "Local Retirada", "Local Devolução", "Tipo", "Valor", "Status"];
  const linhas = ultimoRelatorio.reservas.map((r) => [
    r.id,
    r.veiculo_nome,
    r.categoria || "",
    r.diarias,
    r.local_retirada,
    r.local_devolucao,
    tipoToPt(r.tipo_reserva),
    valorCsv(r.valor_total),
    statusToPt(r.status)
  ]);

  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map(campo).join(";"))
    .join("\r\n");

  // BOM para o Excel reconhecer os acentos (UTF-8)
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const { data_inicio, data_fim } = ultimoRelatorio.periodo;

  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio_reservas_${data_inicio}_a_${data_fim}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderGraficos(data, soAssinatura) {
  if (graficoCategoria) graficoCategoria.destroy();
  if (graficoPeriodo) graficoPeriodo.destroy();
  graficoCategoria = null;
  graficoPeriodo = null;

  if (typeof Chart === "undefined") return;

  const tooltipBRL = {
    callbacks: {
      label: (ctx) => `${ctx.dataset.label || ctx.label}: ${formatBRL(ctx.parsed.y ?? ctx.parsed)}`
    }
  };

  const categorias = data.receita_por_categoria;

  if (categorias.length === 0) {
    document.getElementById("grafico_categoria").style.display = "none";
    document.getElementById("sem_dados_categoria").style.display = "block";
  } else {
    graficoCategoria = new Chart(document.getElementById("grafico_categoria"), {
      type: "pie",
      data: {
        labels: categorias.map((c) => c.categoria),
        datasets: [{
          data: categorias.map((c) => c.receita),
          backgroundColor: categorias.map((c) => corCategoria(c.categoria)),
          borderColor: "#fff",
          borderWidth: 2
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((soma, v) => soma + v, 0);
                const pct = total ? (ctx.parsed / total) * 100 : 0;
                return `${ctx.label}: ${formatBRL(ctx.parsed)} (${formatPct(pct)})`;
              }
            }
          }
        }
      }
    });
  }

  if (soAssinatura) {
    document.getElementById("grafico_periodo").style.display = "none";
    document.getElementById("aviso_periodo").style.display = "block";
    return;
  }

  const periodo = data.receita_periodo;

  graficoPeriodo = new Chart(document.getElementById("grafico_periodo"), {
    data: {
      labels: periodo.map((p) => formatDataBR(p.data)),
      datasets: [
        {
          type: "bar",
          label: "Receita do dia",
          data: periodo.map((p) => p.receita),
          backgroundColor: "#f28c1c",
          yAxisID: "y",
          order: 2
        },
        {
          type: "line",
          label: "Receita acumulada",
          data: periodo.map((p) => p.acumulado),
          borderColor: "#0f172a",
          backgroundColor: "#0f172a",
          pointRadius: periodo.length > 31 ? 0 : 3,
          tension: 0.25,
          yAxisID: "y1",
          order: 1
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: tooltipBRL
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Diária (R$)" }
        },
        y1: {
          beginAtZero: true,
          position: "right",
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Acumulada (R$)" }
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const token = requireAuth();

  const hoje = new Date().toISOString().split("T")[0];
  const primeiroDiaMes = hoje.slice(0, 7) + "-01";
  document.getElementById("data_inicio").value = primeiroDiaMes;
  document.getElementById("data_fim").value = hoje;

  if (token) carregarFiltros(token);

  document.getElementById("form_relatorio").addEventListener("submit", gerarRelatorio);
  document.getElementById("btn_limpar_filtros").addEventListener("click", limparFiltros);
});
