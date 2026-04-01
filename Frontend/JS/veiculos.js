const API_BASE = "http://localhost:5000";

document.getElementById("btn_logout").addEventListener("click", deslogar);

function deslogar(){
  localStorage.clear();
  window.location.href = "../pages/Funcionário/login.html";
}


function getToken() {
  return localStorage.getItem("token");
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

  const marca = document.getElementById("marca").value;
  const modelo = document.getElementById("modelo").value;
  const ano = document.getElementById("ano").value;
  const placa = document.getElementById("placa").value;
  const status = document.getElementById("status").value;

  const dados = { marca, modelo, ano, placa, status };

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
  const token = requireAuth();
  if (!token) return;

  const tbody = document.querySelector(".vehicles-table tbody");
  if (!tbody) return;

  try {
    const resp = await fetch(`${API_BASE}/veiculos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.mensagem || "Erro ao listar veículos");

    tbody.innerHTML = "";
    for (const v of json) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.marca}</td>
        <td>${v.modelo}</td>
        <td>${v.ano}</td>
        <td>${v.placa}</td>
        <td><span class="${statusToTagClass(v.status)}">${statusToPt(v.status)}</span></td>
        <td></td>
      `;

      const tdAcoes = tr.querySelector("td:last-child");
      const select = buildStatusSelect(v.status);
      const btn = document.createElement("button");
      btn.className = "btn btn-inline";
      btn.type = "button";
      btn.textContent = "Salvar";

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn btn-inline";
      btnDelete.type = "button";
      btnDelete.textContent = "Excluir";

      btn.addEventListener("click", async () => {
        const novo = select.value;
        btn.disabled = true;
        try {
          await atualizarStatusVeiculo(v.id, novo);
          const tag = tr.querySelector("td:nth-child(5) span");
          tag.className = statusToTagClass(novo);
          tag.textContent = statusToPt(novo);
          alert("Status atualizado!");
        } catch (e) {
          console.error(e);
          alert(e.message);
        } finally {
          btn.disabled = false;
        }
      });

      btnDelete.addEventListener("click", async () => {
        const ok = confirm(`Excluir o veículo de placa ${v.placa}?`);
        if (!ok) return;

        btnDelete.disabled = true;
        try {
          await deletarVeiculo(v.id);
          tr.remove();
          alert("Veículo excluído!");
        } catch (e) {
          console.error(e);
          alert(e.message);
        } finally {
          btnDelete.disabled = false;
        }
      });

      tdAcoes.appendChild(select);
      tdAcoes.appendChild(document.createTextNode(" "));
      tdAcoes.appendChild(btn);
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

function wireVeiculosPage() {
  const form = document.querySelector("form.card");
  if (form && document.getElementById("marca") && document.getElementById("placa")) {
    form.addEventListener("submit", cadastrarVeiculo);
  }

  const table = document.querySelector(".vehicles-table");
  if (table) carregarVeiculos();

  carregarDashboard();
}

document.addEventListener("DOMContentLoaded", wireVeiculosPage);

