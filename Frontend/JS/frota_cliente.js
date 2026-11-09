document.addEventListener("DOMContentLoaded", () => {
    carregarFrotaParaClientes();
});

let veiculosDisponiveis = [];

async function carregarFrotaParaClientes() {
    try {
        const resp = await fetch(`${API_BASE}/veiculos/disponiveis`);
        if (!resp.ok) {
            throw new Error("Não foi possível carregar a frota.");
        }
        const veiculos = await resp.json();

        veiculosDisponiveis = veiculos;
        prepararFiltrosFrota();
        renderizarFrota(veiculosDisponiveis);

    } catch (error) {
        console.error("Erro ao buscar a frota:", error);
        document.getElementById("grid_frota").innerHTML = "<p>Erro ao conectar com o catálogo de veículos.</p>";
    }
}

function prepararFiltrosFrota() {
    const categorias = [...new Set(veiculosDisponiveis.map(v => v.categoria).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
    const filtroCategoria = document.getElementById("filtro_categoria");

    categorias.forEach(categoria => {
        const opcao = document.createElement("option");
        opcao.value = categoria;
        opcao.textContent = categoria;
        filtroCategoria.appendChild(opcao);
    });

    ["filtro_busca", "filtro_categoria", "filtro_preco_maximo"].forEach(id => {
        document.getElementById(id).addEventListener("input", filtrarFrota);
    });
    document.getElementById("limpar_filtros").addEventListener("click", () => {
        document.getElementById("filtro_busca").value = "";
        document.getElementById("filtro_categoria").value = "";
        document.getElementById("filtro_preco_maximo").value = "";
        renderizarFrota(veiculosDisponiveis);
    });
}

function filtrarFrota() {
    const busca = normalizarTexto(document.getElementById("filtro_busca").value.trim());
    const categoria = document.getElementById("filtro_categoria").value;
    const valorMaximo = document.getElementById("filtro_preco_maximo").value;
    const precoMaximo = valorMaximo === "" ? null : Number(valorMaximo);

    const filtrados = veiculosDisponiveis.filter(veiculo => {
        const textoVeiculo = normalizarTexto(`${veiculo.marca} ${veiculo.modelo}`);
        const correspondeBusca = !busca || textoVeiculo.includes(busca);
        const correspondeCategoria = !categoria || veiculo.categoria === categoria;
        const correspondePreco = precoMaximo === null || veiculo.valor_diaria <= precoMaximo;
        return correspondeBusca && correspondeCategoria && correspondePreco;
    });

    renderizarFrota(filtrados);
}

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function renderizarFrota(veiculos) {
    const container = document.getElementById("grid_frota");
    const resultado = document.getElementById("resultado_filtros");
    container.innerHTML = "";

    if (veiculos.length === 0) {
        container.innerHTML = `<p>${veiculosDisponiveis.length
            ? "Nenhum veículo encontrado com esses filtros."
            : "Nenhum veículo disponível na nossa frota no momento."}</p>`;
    } else {
        veiculos.forEach(v => {
            const detalhes = [
                v.categoria    ? `<span>🏷️ ${v.categoria}</span>`    : "",
                v.transmissao  ? `<span>⚙️ ${v.transmissao}</span>`  : "",
                v.combustivel  ? `<span>⛽ ${v.combustivel}</span>`  : "",
                v.cor          ? `<span>🎨 ${v.cor}</span>`          : "",
            ].filter(Boolean).join("");

            const diaria = (v.valor_diaria ?? 150).toFixed(2).replace(".", ",");
            const mediaHtml = v.avaliacao_media
                ? `<span class="avg-rating" onclick="verAvaliacoes(${v.id})">★ ${v.avaliacao_media.toFixed(1).replace(".", ",")}</span>`
                : "";

            const div = document.createElement("div");
            div.className = "car-type-card";
            div.innerHTML = `
                ${htmlFotoVeiculo(v.imagem, `${v.marca} ${v.modelo}`)}
                <h3>${v.marca} ${v.modelo}</h3>
                <p><strong>Ano:</strong> ${v.ano} &nbsp;|&nbsp; <strong>Placa:</strong> ${v.placa}</p>
                ${detalhes ? `<p class="car-detalhes">${detalhes}</p>` : ""}
                <p class="car-diaria">R$ ${diaria}<span>/dia</span></p>
                <span class="points-badge">+${v.pontos_fidelidade || 30} pontos</span>
                ${mediaHtml}
                <button class="btn-find-cars" onclick="irParaReserva(${v.id})">
                    Alugar Agora
                </button>
            `;
            container.appendChild(div);
        });
    }

    resultado.textContent = `${veiculos.length} ${veiculos.length === 1 ? "veículo encontrado" : "veículos encontrados"}`;
}

function irParaReserva(veiculoId) {
    sessionStorage.setItem('selectedVehicleId', veiculoId);
    window.location.href = "reservar_veiculo.html";
}
