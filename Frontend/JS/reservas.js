document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("lista_veiculos")) {
        let jsonDadosSalvos = sessionStorage.getItem("carSearchData");

        if (jsonDadosSalvos) {
            let searchData = JSON.parse(jsonDadosSalvos);

            if (searchData.pickupLocation) {
                document.getElementById("local_retirada").value = searchData.pickupLocation;
            }
            if (searchData.dropoffLocation) {
                document.getElementById("local_devolucao").value = searchData.dropoffLocation;
            }
            if (searchData.pickupDate) {
                document.getElementById("data_retirada").value = searchData.pickupDate;
            }
            if (searchData.dropoffDate) {
                document.getElementById("data_devolucao").value = searchData.dropoffDate;
            }
        }

        initializeLocationAutocomplete();

        carregarVeiculosDisponiveis();
    }
    if (document.getElementById("lista_minhas_reservas")) {
        carregarMinhasReservas();
    }
});

async function carregarVeiculosDisponiveis() {
    const selectedVehicleId = sessionStorage.getItem('selectedVehicleId');

    try {
        let request = await fetch(`${API_BASE}/veiculos/disponiveis`);
        let veiculos = await request.json();

        let container = document.getElementById("lista_veiculos");
        container.innerHTML = "";

        if (veiculos.length === 0) {
            container.innerHTML = "<p>Nenhum veículo disponível no momento.</p>";
            return;
        }

        veiculos.forEach(v => {
            let isSelected = selectedVehicleId && Number(selectedVehicleId) === v.id;
            let highlight = isSelected ? 'border: 3px solid #e63946; box-shadow: 0 0 20px rgba(230, 57, 70, 0.15);' : '';
            const diaria = (v.valor_diaria ?? 150).toFixed(2).replace(".", ",");

            let div = document.createElement("div");
            div.className = "car-type-card";
            div.style.cssText = highlight;
            div.dataset.vehicleId = v.id;
            div.dataset.valorDiaria = v.valor_diaria ?? 150;
            div.innerHTML = `
                <div class="car-icon">🚗</div>
                <h3>${v.marca} ${v.modelo}</h3>
                <p><strong>Ano:</strong> ${v.ano}</p>
                <p><strong>Placa:</strong> ${v.placa}</p>
                <p style="color: #e63946; font-weight: bold; margin-top: 10px;">Diária: R$ ${diaria}</p>

                <button class="btn-find-cars" style="margin-top: 15px; width: 100%;" onclick="reservarVeiculo(${v.id})">
                    Reservar Este
                </button>
            `;
            container.appendChild(div);
        });

        if (selectedVehicleId) {
            let selectedCard = container.querySelector(`[data-vehicle-id="${selectedVehicleId}"]`);
            if (selectedCard) {
                selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                sessionStorage.removeItem('selectedVehicleId');
            }
        }

    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        document.getElementById("lista_veiculos").innerHTML = "<p>Erro ao carregar o catálogo de veículos.</p>";
    }
}

async function reservarVeiculo(veiculoId) {
    let dataRetirada = document.getElementById("data_retirada").value;
    let dataDevolucao = document.getElementById("data_devolucao").value;
    let localRetirada = document.getElementById("local_retirada").value;
    let localDevolucao = document.getElementById("local_devolucao").value;

    if (!dataRetirada || !dataDevolucao || !localRetirada || !localDevolucao) {
        alert("Por favor, preencha todos os locais e datas!");
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

    const card = document.querySelector(`[data-vehicle-id="${veiculoId}"]`);
    const valorDiaria = card ? parseFloat(card.dataset.valorDiaria) : 150;
    let valorTotal = dias * valorDiaria;

    let confirmacao = confirm(`Resumo da Reserva:\n\nLocal: ${localRetirada}\nDias: ${dias}\nValor Total: R$ ${valorTotal.toFixed(2)}\n\nDeseja confirmar a locação?`);
    if (!confirmacao) return;

    let token = localStorage.getItem('token_cliente');
    if (!token) {
        alert("Você precisa estar logado para fazer uma reserva!");
        window.location.href = "Cliente/login.html";
        return;
    }

    let dados = {
        veiculo_id: veiculoId,
        data_retirada: dataRetirada,
        data_devolucao: dataDevolucao,
        local_retirada: localRetirada,
        local_devolucao: localDevolucao
    };

    try {
        let request = await fetch(`${API_BASE}/reservas`, {
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
            sessionStorage.removeItem('carSearchData');
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
    let token = localStorage.getItem('token_cliente');

    if (!token) {
        alert("Você precisa estar logado para ver suas reservas.");
        window.location.href = "Cliente/login.html";
        return;
    }

    try {
        let request = await fetch(`${API_BASE}/reservas/minhas`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        let container = document.getElementById("lista_minhas_reservas");

        if (!request.ok) {
            let erroFlask = await request.json().catch(() => ({}));
            container.innerHTML = `<p style="color: red;">Erro: ${erroFlask.mensagem || 'Falha interna no servidor.'} Olha o F12.</p>`;
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

            let actionButton = '';
            if (r.status === 'Active') {
                actionButton = `<button class="btn-find-cars" style="margin-top: 15px; width: 100%;" onclick="realizarCheckIn(${r.id})">Check-in</button>`;
            } else if (r.status === 'Em Uso') {
                actionButton = `<button class="btn-find-cars" style="margin-top: 15px; width: 100%;" onclick="realizarCheckOut(${r.id})">Check-out</button>`;
            }

            let div = document.createElement("div");
            div.className = "car-type-card";
            div.style.borderTop = "4px solid #e63946";
            div.innerHTML = `
                <div class="car-icon">🚗</div>
                <h3>${r.veiculo_nome}</h3>
                <p><strong>Placa:</strong> ${r.veiculo_placa}</p>
                <hr style="margin: 15px 0; border: 0.5px solid #eee;">
                <p><strong>Local:</strong> ${r.local_retirada}</p>
                <p><strong>Retirada:</strong> ${dataRet}</p>
                <p><strong>Devolução:</strong> ${dataDev}</p>
                <p style="color: #e63946; font-weight: bold; margin-top: 15px; font-size: 1.1em;">
                    Total Pago: R$ ${r.valor_total.toFixed(2)}
                </p>
                <p style="margin-top: 10px; font-size: 0.9em; color: ${r.status === 'Active' ? 'green' : 'gray'};">
                    Status: <strong>${r.status}</strong>
                </p>
                ${actionButton}
            `;
            container.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao buscar reservas:", error);
        document.getElementById("lista_minhas_reservas").innerHTML = "<p>Falha de conexão com o servidor.</p>";
    }
}

async function realizarCheckIn(reservaId) {
    let token = localStorage.getItem('token_cliente');
    if (!token) {
        alert("Você precisa estar logado para realizar o check-in.");
        window.location.href = "Cliente/login.html";
        return;
    }

    if (!confirm('Deseja confirmar o check-in desta reserva?')) return;

    try {
        let request = await fetch(`${API_BASE}/reservas/${reservaId}/check-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        let resposta = await request.json();
        if (request.ok) {
            alert(resposta.mensagem || 'Check-in realizado com sucesso!');
            carregarMinhasReservas();
        } else {
            alert(resposta.mensagem || 'Erro ao realizar check-in.');
        }
    } catch (error) {
        console.error('Erro no check-in:', error);
        alert('Falha de conexão ao realizar check-in.');
    }
}

async function realizarCheckOut(reservaId) {
    let token = localStorage.getItem('token_cliente');
    if (!token) {
        alert("Você precisa estar logado para realizar o check-out.");
        window.location.href = "Cliente/login.html";
        return;
    }

    if (!confirm('Deseja confirmar o check-out desta reserva?')) return;

    try {
        let request = await fetch(`${API_BASE}/reservas/${reservaId}/check-out`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        let resposta = await request.json();
        if (request.ok) {
            alert(resposta.mensagem || 'Check-out realizado com sucesso!');
            carregarMinhasReservas();
        } else {
            alert(resposta.mensagem || 'Erro ao realizar check-out.');
        }
    } catch (error) {
        console.error('Erro no check-out:', error);
        alert('Falha de conexão ao realizar check-out.');
    }
}

function initializeLocationAutocomplete() {
    const pickupLocationInput = document.getElementById('local_retirada');
    const dropoffLocationInput = document.getElementById('local_devolucao');
    const pickupSuggestions = document.getElementById('retiradaSuggestions');
    const dropoffSuggestions = document.getElementById('devolucaoSuggestions');

    if (!pickupLocationInput || !pickupSuggestions) return;

    const locations = [
        'São Paulo - Centro',
        'São Paulo - Congonhas',
        'São Paulo - Guarulhos',
        'Diadema - Centro',
        'São Bernardo do Campo - Paço Municipal',
        'Santo André - Grand Plaza',
        'Rio de Janeiro - Galeão',
        'Belo Horizonte - Confins',
        'Curitiba - Aeroporto',
        'Porto Alegre - Aeroporto'
    ];

    pickupLocationInput.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        if (value.length > 0) {
            const filtered = locations.filter(loc => loc.toLowerCase().includes(value));
            displaySuggestions(filtered, pickupSuggestions, pickupLocationInput);
        } else {
            pickupSuggestions.innerHTML = '';
        }
    });

    dropoffLocationInput.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        if (value.length > 0) {
            const filtered = locations.filter(loc => loc.toLowerCase().includes(value));
            displaySuggestions(filtered, dropoffSuggestions, dropoffLocationInput);
        } else {
            dropoffSuggestions.innerHTML = '';
        }
    });
}

function displaySuggestions(suggestions, container, inputField) {
    container.innerHTML = '';

    if (suggestions.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = suggestion;
        div.style.cursor = 'pointer';
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid #eee';
        div.style.transition = 'background-color 0.2s';

        div.addEventListener('mouseover', function () {
            this.style.backgroundColor = '#f5f5f5';
        });

        div.addEventListener('mouseout', function () {
            this.style.backgroundColor = 'white';
        });

        div.addEventListener('click', function () {
            inputField.value = suggestion;
            container.innerHTML = '';
            container.style.display = 'none';
        });

        container.appendChild(div);
    });
}