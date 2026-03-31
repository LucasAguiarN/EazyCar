// Home Page Script - Gerencia o formulário de reserva e interações da página inicial

document.addEventListener('DOMContentLoaded', function() {
    initializeReserveForm();
    initializeLocationAutocomplete();
    initializeSameAsPickupCheckbox();
    initializeNavigation();
});

// Inicializa o formulário de reserva
function initializeReserveForm() {
    const form = document.getElementById('reserveForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleReserveSubmit();
        });

        // Validação de data em tempo real
        const pickupDate = document.getElementById('pickupDate');
        const dropoffDate = document.getElementById('dropoffDate');

        pickupDate.addEventListener('change', function() {
            validateDates();
        });

        dropoffDate.addEventListener('change', function() {
            validateDates();
        });
    }
}

// Valida se as datas estão corretas
function validateDates() {
    const pickupDate = new Date(document.getElementById('pickupDate').value);
    const dropoffDate = new Date(document.getElementById('dropoffDate').value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pick-up não pode ser no passado
    if (pickupDate < today) {
        document.getElementById('pickupDate').style.borderColor = '#ff4444';
        showNotification('A data de retirada não pode ser no passado', 'error');
        return false;
    }

    // Drop-off não pode ser antes de pick-up
    if (dropoffDate < pickupDate) {
        document.getElementById('dropoffDate').style.borderColor = '#ff4444';
        showNotification('A data de devolução não pode ser antes da retirada', 'error');
        return false;
    }

    // Reset das cores
    document.getElementById('pickupDate').style.borderColor = '';
    document.getElementById('dropoffDate').style.borderColor = '';
    
    return true;
}

// Inicializa o autocomplete de localização
function initializeLocationAutocomplete() {
    const pickupLocationInput = document.getElementById('pickupLocation');
    const dropoffLocationInput = document.getElementById('dropoffLocation');
    const pickupSuggestions = document.getElementById('pickupSuggestions');
    const dropoffSuggestions = document.getElementById('dropoffSuggestions');

    // Localizações de exemplo (em um app real, viriam de uma API)
    const locations = [
        'São Paulo - Centro',
        'São Paulo - Congonhas',
        'São Paulo - Guarulhos',
        'Rio de Janeiro - Galeão',
        'Rio de Janeiro - Centro',
        'Belo Horizonte - Confins',
        'Salvador - Aeroporto',
        'Brasília - Aeroporto',
        'Curitiba - Aeroporto',
        'Porto Alegre - Aeroporto'
    ];

    pickupLocationInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        if (value.length > 0) {
            const filtered = locations.filter(loc => loc.toLowerCase().includes(value));
            displaySuggestions(filtered, pickupSuggestions, pickupLocationInput);
        } else {
            pickupSuggestions.innerHTML = '';
        }
    });

    dropoffLocationInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        if (value.length > 0) {
            const filtered = locations.filter(loc => loc.toLowerCase().includes(value));
            displaySuggestions(filtered, dropoffSuggestions, dropoffLocationInput);
        } else {
            dropoffSuggestions.innerHTML = '';
        }
    });
}

// Exibe as sugestões de localização
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

        div.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#f5f5f5';
        });

        div.addEventListener('mouseout', function() {
            this.style.backgroundColor = 'white';
        });

        div.addEventListener('click', function() {
            inputField.value = suggestion;
            container.innerHTML = '';
            container.style.display = 'none';
        });

        container.appendChild(div);
    });
}

// Inicializa o checkbox "same as pick-up"
function initializeSameAsPickupCheckbox() {
    const checkbox = document.getElementById('sameAsPickup');
    const pickupLocationInput = document.getElementById('pickupLocation');
    const dropoffLocationInput = document.getElementById('dropoffLocation');

    if (checkbox) {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                dropoffLocationInput.value = pickupLocationInput.value;
                dropoffLocationInput.disabled = true;
            } else {
                dropoffLocationInput.disabled = false;
            }
        });

        // Sincroniza automaticamente se o checkbox já está marcado
        pickupLocationInput.addEventListener('change', function() {
            if (checkbox.checked) {
                dropoffLocationInput.value = this.value;
            }
        });
    }
}

// Processa o envio do formulário de reserva
function handleReserveSubmit() {
    const pickupLocation = document.getElementById('pickupLocation').value;
    const pickupDate = document.getElementById('pickupDate').value;
    const dropoffDate = document.getElementById('dropoffDate').value;
    const dropoffLocation = document.getElementById('dropoffLocation').value;

    // Validações
    if (!pickupLocation || !pickupDate || !dropoffDate || !dropoffLocation) {
        showNotification('Por favor, preencha todos os campos', 'error');
        return;
    }

    // Valida datas
    if (!validateDates()) {
        return;
    }

    // Armazena os dados de busca no session storage
    const searchData = {
        pickupLocation: pickupLocation,
        pickupDate: pickupDate,
        dropoffDate: dropoffDate,
        dropoffLocation: dropoffLocation,
        timestamp: new Date().toISOString()
    };

    sessionStorage.setItem('carSearchData', JSON.stringify(searchData));

    // Redireciona para página de listagem de veículos
    window.location.href = 'pages/listar_veiculos.html';
}

// Inicializa navegação dinâmica
function initializeNavigation() {
    // Verifica se tem token de autenticação
    const token = localStorage.getItem('token');
    
    if (token) {
        // Usuário está logado - pode mostrar opções personalizadas
        console.log('Usuário autenticado');
    }
}

// Função auxiliar para mostrar notificações
function showNotification(message, type = 'info') {
    // Cria um elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;

    if (type === 'error') {
        notification.style.backgroundColor = '#ff4444';
        notification.style.color = 'white';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';
    } else {
        notification.style.backgroundColor = '#2196F3';
        notification.style.color = 'white';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Adiciona estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .suggestions-list {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 5px 5px;
        max-height: 200px;
        overflow-y: auto;
        width: 100%;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .suggestion-item {
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        transition: background-color 0.2s;
    }

    .suggestion-item:hover {
        background-color: #f5f5f5;
    }

    .suggestion-item:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);
