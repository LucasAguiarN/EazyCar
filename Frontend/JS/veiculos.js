const API_BASE = "http://localhost:5000";

document.getElementById("btn_logout").addEventListener("click", deslogar);

function deslogar() {
  localStorage.removeItem('token_funcionario');
  window.location.href = "../pages/Funcionário/login.html";
}


function getToken() {
  return localStorage.getItem("token_funcionario");
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    alert("Você precisa estar logado como funcionário para acessar.");
    // Ajuste o caminho se seu login estiver em outro lugar.
    window.location.href = "../pages/Funcionário/login.html";
    return null;
  }
  return token;
}

function statusToTagClass(status) {
  if (status === "Available") return "tag tag-available";
  if (status === "Rented") return "tag tag-rented";
  if (status === "Maintenance") return "tag tag-maintenance";
  return "tag";
}

function statusToPt(status) {
  if (status === "Available") return "Disponível";
  if (status === "Rented") return "Alugado";
  if (status === "Maintenance") return "Manutenção";
  return status || "";
}

function buildStatusSelect(current) {
  const select = document.createElement("select");
  select.className = "status-select";

  const opts = [
    { value: "Available", label: "Disponível" },
    { value: "Rented", label: "Alugado" },
    { value: "Maintenance", label: "Manutenção" },
  ];

  for (const o of opts) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === current) opt.selected = true;
    select.appendChild(opt);
  }

  return select;
}

async function atualizarStatusVeiculo(veiculoId, novoStatus) {
  const token = requireAuth();
  if (!token) return false;

  const resp = await fetch(`${API_BASE}/veiculos/${veiculoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: novoStatus }),
  });

  const json = await resp.json();
  if (!resp.ok) throw new Error(json.mensagem || "Erro ao atualizar status");
  return true;
}

async function deletarVeiculo(veiculoId) {
  const token = requireAuth();
  if (!token) return false;

  const resp = await fetch(`${API_BASE}/veiculos/${veiculoId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await resp.json();
  if (!resp.ok) throw new Error(json.mensagem || "Erro ao deletar veículo");
  return true;
}

async function cadastrarVeiculo(event) {
  event.preventDefault();
  const token = requireAuth();
  if (!token) return;

  const dados = {
    marca:        document.getElementById("marca").value,
    modelo:       document.getElementById("modelo").value,
    ano:          document.getElementById("ano").value,
    placa:        document.getElementById("placa").value,
    cor:          document.getElementById("cor").value || null,
    combustivel:  document.getElementById("combustivel").value || null,
    transmissao:  document.getElementById("transmissao").value || null,
    categoria:    document.getElementById("categoria").value || null,
    valor_diaria: parseFloat(document.getElementById("valor_diaria").value),
    status:       document.getElementById("status").value,
  };

  try {
    const resp = await fetch(`${API_BASE}/veiculos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });

    const json = await resp.json();
    if (!resp.ok) throw new Error(json.mensagem || "Erro ao cadastrar veículo");

    alert("Veículo cadastrado com sucesso!");
    window.location.href = "listar_veiculos.html";
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

async function carregarVeiculos() {
  const tbody = document.querySelector(".vehicles-table tbody");
  if (!tbody) return;

  const token = requireAuth();
  if (!token) return;

  try {
    const resp = await fetch(`${API_BASE}/veiculos`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let json;
    try {
      json = await resp.json();
    } catch {
      throw new Error(`Erro ${resp.status} do servidor. Verifique se o banco de dados foi atualizado com as novas colunas.`);
    }

    if (!resp.ok) throw new Error(json.mensagem || "Erro ao listar veículos");

    tbody.innerHTML = "";

    for (const v of json) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.marca}</td>
        <td>${v.modelo}</td>
        <td>${v.ano}</td>
        <td>${v.placa}</td>
        <td>${v.categoria || "—"}</td>
        <td>R$ ${(v.valor_diaria ?? 0).toFixed(2).replace(".", ",")}</td>
        <td><span class="${statusToTagClass(v.status)}">${statusToPt(v.status)}</span></td>
        <td></td>
      `;

      const tdAcoes = tr.querySelector("td:last-child");

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn btn-inline";
      btnEdit.textContent = "Editar";
      btnEdit.addEventListener("click", () => {
        sessionStorage.setItem("editVeiculoId", v.id);
        window.location.href = "editar_veiculo.html";
      });

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn btn-inline";
      btnDelete.textContent = "Excluir";

      btnDelete.addEventListener("click", async () => {
        if (!confirm(`Excluir ${v.marca} ${v.modelo} (${v.placa})?`)) return;
        try {
          await deletarVeiculo(v.id);
          tr.remove();
        } catch (e) {
          alert(e.message);
        }
      });

      tdAcoes.appendChild(btnEdit);
      tdAcoes.appendChild(document.createTextNode(" "));
      tdAcoes.appendChild(btnDelete);
      tbody.appendChild(tr);
    }
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

async function carregarDashboard() {
  const elTotal = document.getElementById("stat_total");
  const elDisponiveis = document.getElementById("stat_disponiveis");
  const elAlugados = document.getElementById("stat_alugados");
  const elManutencao = document.getElementById("stat_manutencao");

  const isDashboard =
    elTotal && elDisponiveis && elAlugados && elManutencao;
  if (!isDashboard) return;

  const token = requireAuth();
  if (!token) return;

  try {
    const resp = await fetch(`${API_BASE}/veiculos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const veiculos = await resp.json();
    if (!resp.ok) throw new Error(veiculos.mensagem || "Erro ao carregar painel");

    const total = veiculos.length;
    let disponiveis = 0;
    let alugados = 0;
    let manutencao = 0;

    for (const v of veiculos) {
      if (v.status === "Available") disponiveis += 1;
      else if (v.status === "Rented") alugados += 1;
      else if (v.status === "Maintenance") manutencao += 1;
    }

    elTotal.textContent = String(total);
    elDisponiveis.textContent = String(disponiveis);
    elAlugados.textContent = String(alugados);
    elManutencao.textContent = String(manutencao);
  } catch (e) {
    console.error(e);
    elTotal.textContent = "—";
    elDisponiveis.textContent = "—";
    elAlugados.textContent = "—";
    elManutencao.textContent = "—";
  }
}

async function carregarVeiculoParaEdicao() {
  const veiculoId = sessionStorage.getItem("editVeiculoId");
  if (!veiculoId) {
    alert("Nenhum veículo selecionado para edição.");
    window.location.href = "listar_veiculos.html";
    return;
  }

  const token = requireAuth();
  if (!token) return;

  try {
    const resp = await fetch(`${API_BASE}/veiculos/${veiculoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let json;
    try {
      json = await resp.json();
    } catch {
      throw new Error(`Erro ${resp.status} do servidor.`);
    }

    if (!resp.ok) throw new Error(json.mensagem || "Erro ao carregar veículo.");

    document.getElementById("marca").value        = json.marca        || "";
    document.getElementById("modelo").value       = json.modelo       || "";
    document.getElementById("ano").value          = json.ano          || "";
    document.getElementById("placa").value        = json.placa        || "";
    document.getElementById("cor").value          = json.cor          || "";
    document.getElementById("combustivel").value  = json.combustivel  || "";
    document.getElementById("transmissao").value  = json.transmissao  || "";
    document.getElementById("categoria").value    = json.categoria    || "";
    document.getElementById("valor_diaria").value = json.valor_diaria || "";
    document.getElementById("status").value       = json.status       || "Available";
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

async function salvarEdicaoVeiculo(event) {
  event.preventDefault();

  const veiculoId = sessionStorage.getItem("editVeiculoId");
  if (!veiculoId) return;

  const token = requireAuth();
  if (!token) return;

  const dados = {
    marca:        document.getElementById("marca").value,
    modelo:       document.getElementById("modelo").value,
    ano:          document.getElementById("ano").value,
    placa:        document.getElementById("placa").value,
    cor:          document.getElementById("cor").value || null,
    combustivel:  document.getElementById("combustivel").value || null,
    transmissao:  document.getElementById("transmissao").value || null,
    categoria:    document.getElementById("categoria").value || null,
    valor_diaria: parseFloat(document.getElementById("valor_diaria").value),
    status:       document.getElementById("status").value,
  };

  try {
    const resp = await fetch(`${API_BASE}/veiculos/${veiculoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });

    const json = await resp.json();
    if (!resp.ok) throw new Error(json.mensagem || "Erro ao atualizar veículo.");

    sessionStorage.removeItem("editVeiculoId");
    alert("Veículo atualizado com sucesso!");
    window.location.href = "listar_veiculos.html";
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

function wireVeiculosPage() {
  const formCadastro = document.getElementById("form_veiculo");
  if (formCadastro) {
    formCadastro.addEventListener("submit", cadastrarVeiculo);
  }

  const formEdicao = document.getElementById("form_editar_veiculo");
  if (formEdicao) {
    carregarVeiculoParaEdicao();
    formEdicao.addEventListener("submit", salvarEdicaoVeiculo);
  }

  const table = document.querySelector(".vehicles-table");
  if (table) carregarVeiculos();

  carregarDashboard();
}

document.addEventListener("DOMContentLoaded", wireVeiculosPage);

