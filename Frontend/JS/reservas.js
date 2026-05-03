document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("lista_veiculos")) {
        let jsonDadosSalvos = sessionStorage.getItem("carSearchData");

        if (jsonDadosSalvos) {
            let searchData = JSON.parse(jsonDadosSalvos);
            if (searchData.pickupDate) {
                document.getElementById("data_retirada").value = searchData.pickupDate;
            }
            if (searchData.dropoffDate) {
                document.getElementById("data_devolucao").value = searchData.dropoffDate;
            }
        }
        carregarVeiculosDisponiveis();
    }
    if (document.getElementById("lista_minhas_reservas")) {
        carregarMinhasReservas();
    }
});

async function carregarVeiculosDisponiveis() {
    try {
        let request = await fetch("http://localhost:5000/veiculos/disponiveis");
        let veiculos = await request.json();

        let container = document.getElementById("lista_veiculos");
        container.innerHTML = "";

        if (veiculos.length === 0) {
            container.innerHTML = "<p>Nenhum veículo disponível no momento.</p>";
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
                
                <button class="btn-find-cars" style="margin-top: 15px; width: 100%;" onclick="reservarVeiculo(${v.id})">
                    Reservar Este
                </button>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        document.getElementById("lista_veiculos").innerHTML = "<p>Erro ao carregar o catálogo de veículos.</p>";
    }
}

async function reservarVeiculo(veiculoId) {
    let dataRetirada = document.getElementById("data_retirada").value;
    let dataDevolucao = document.getElementById("data_devolucao").value;

    if (!dataRetirada || !dataDevolucao) {
        alert("Por favor, escolha o dia de retirada e devolução!");
        return;
    }

    let inicio = new Date(dataRetirada);
    let fim = new Date(dataDevolucao);
    let diffTempo = fim.getTime() - inicio.getTime();
    let dias = diffTempo / (1000 * 3600 * 24);

    if (dias <= 0) {
        alert("A data de devolução precisa ser depois da data de retirada.");
        return;
    }

    let valorTotal = dias * 150;

    let confirmacao = confirm(`Resumo da Reserva:\n\nDias: ${dias}\nValor Total: R$ ${valorTotal.toFixed(2)}\n\nDeseja confirmar a locação?`);
    if (!confirmacao) return;

    let token = localStorage.getItem('token');
    if (!token) {
        alert("Você precisa estar logado para fazer uma reserva!");
        window.location.href = "Cliente/login.html";
        return;
    }

    let dados = {
        veiculo_id: veiculoId,
        data_retirada: dataRetirada,
        data_devolucao: dataDevolucao
    };

    try {
        let request = await fetch("http://localhost:5000/reservas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        let resposta = await request.json();

        if (request.ok) {
            alert("Sucesso! O carro foi reservado.");
            carregarVeiculosDisponiveis();
        } else {
            alert(resposta.mensagem || "Erro ao realizar reserva.");
        }
    } catch (error) {
        console.error("Erro na reserva:", error);
        alert("Falha de conexão com a API.");
    }
}

async function carregarMinhasReservas() {
    let token = localStorage.getItem('token');

    if (!token) {
        alert("Você precisa estar logado para ver suas reservas.");
        window.location.href = "Cliente/login.html";
        return;
    }

    try {
        let request = await fetch("http://localhost:5000/reservas/minhas", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        let container = document.getElementById("lista_minhas_reservas");

        if (!request.ok) {
            container.innerHTML = "<p>Erro ao carregar reservas. Tente logar novamente.</p>";
            return;
        }

        let reservas = await request.json();
        container.innerHTML = "";

        if (reservas.length === 0) {
            container.style.display = "block";
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 0;">
                    <h3 style="color: #666;">Você ainda não possui nenhum veículo reservado.</h3>
                    <p style="margin-bottom: 20px;">Que tal dar uma olhada na nossa frota?</p>
                    <a href="veiculos.html" class="btn-find-cars" style="text-decoration: none; padding: 10px 20px;">Ver Veículos Disponíveis</a>
                </div>
            `;
            return;
        }

        reservas.forEach(r => {
            let dataRet = r.data_retirada.split('-').reverse().join('/');
            let dataDev = r.data_devolucao.split('-').reverse().join('/');

            let div = document.createElement("div");
            div.className = "car-type-card";
            div.style.borderTop = "4px solid #e63946";
            div.innerHTML = `
                <div class="car-icon">🚗</div>
                <h3>${r.veiculo_nome}</h3>
                <p><strong>Placa:</strong> ${r.veiculo_placa}</p>
                <hr style="margin: 15px 0; border: 0.5px solid #eee;">
                <p><strong>Retirada:</strong> ${dataRet}</p>
                <p><strong>Devolução:</strong> ${dataDev}</p>
                <p style="color: #e63946; font-weight: bold; margin-top: 15px; font-size: 1.1em;">
                    Total Pago: R$ ${r.valor_total.toFixed(2)}
                </p>
                <p style="margin-top: 10px; font-size: 0.9em; color: ${r.status === 'Active' ? 'green' : 'gray'};">
                    Status: <strong>${r.status}</strong>
                </p>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao buscar reservas:", error);
        document.getElementById("lista_minhas_reservas").innerHTML = "<p>Falha de conexão com o servidor.</p>";
    }
}