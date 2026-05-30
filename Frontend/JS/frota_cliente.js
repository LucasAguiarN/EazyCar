document.addEventListener("DOMContentLoaded", () => {
    carregarFrotaParaClientes();
});

async function carregarFrotaParaClientes() {
    try {
        const resp = await fetch("https://eazycarapi.up.railway.app/veiculos/disponiveis");
        const veiculos = await resp.json();

        const container = document.getElementById("grid_frota");
        container.innerHTML = "";

        if (veiculos.length === 0) {
            container.innerHTML = "<p>Nenhum veículo disponível na nossa frota no momento.</p>";
            return;
        }

        veiculos.forEach(v => {
            const detalhes = [
                v.categoria    ? `<span>🏷️ ${v.categoria}</span>`    : "",
                v.transmissao  ? `<span>⚙️ ${v.transmissao}</span>`  : "",
                v.combustivel  ? `<span>⛽ ${v.combustivel}</span>`  : "",
                v.cor          ? `<span>🎨 ${v.cor}</span>`          : "",
            ].filter(Boolean).join("");

            const diaria = (v.valor_diaria ?? 150).toFixed(2).replace(".", ",");

            const div = document.createElement("div");
            div.className = "car-type-card";
            div.innerHTML = `
                <div class="car-icon">🚗</div>
                <h3>${v.marca} ${v.modelo}</h3>
                <p><strong>Ano:</strong> ${v.ano} &nbsp;|&nbsp; <strong>Placa:</strong> ${v.placa}</p>
                ${detalhes ? `<p class="car-detalhes">${detalhes}</p>` : ""}
                <p class="car-diaria">R$ ${diaria}<span>/dia</span></p>
                <button class="btn-find-cars" onclick="irParaReserva(${v.id})">
                    Alugar Agora
                </button>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao buscar a frota:", error);
        document.getElementById("grid_frota").innerHTML = "<p>Erro ao conectar com o catálogo de veículos.</p>";
    }
}

function irParaReserva(veiculoId) {
    sessionStorage.setItem('selectedVehicleId', veiculoId);
    window.location.href = "reservar_veiculo.html";
}
