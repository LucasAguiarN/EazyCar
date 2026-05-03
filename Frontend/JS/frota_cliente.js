document.addEventListener("DOMContentLoaded", () => {
    carregarFrotaParaClientes();
});

async function carregarFrotaParaClientes() {
    try {
        let request = await fetch("http://localhost:5000/veiculos/disponiveis");
        let veiculos = await request.json();

        let container = document.getElementById("grid_frota");
        container.innerHTML = "";

        if (veiculos.length === 0) {
            container.innerHTML = "<p>Nenhum veículo disponível na nossa frota no momento.</p>";
            return;
        }

        veiculos.forEach(v => {
            let div = document.createElement("div");
            div.className = "car-type-card";
            div.innerHTML = `
                <div class="car-icon">🚗</div>
                <h3>${v.marca} ${v.modelo}</h3>
                <p><strong>Ano:</strong> ${v.ano}</p>
                <p><strong>Placa:</strong> ${v.placa}</p>
                <p style="color: #e63946; font-weight: bold; margin-top: 10px;">Diária: R$ 150,00</p>
                
                <button class="btn-find-cars" style="margin-top: 15px; width: 100%;" onclick="irParaReserva()">
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

function irParaReserva() {
    window.location.href = "../index.html";
}