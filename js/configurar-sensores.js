// Configuração da API
const API_URL = 'https://api.thalesgmartins.com.br'; 

document.addEventListener('DOMContentLoaded', () => {
    carregarSensores();
    
    // Escuta o envio do formulário
    document.getElementById('sensor-form').addEventListener('submit', salvarSensor);
});

// --- FUNÇÕES PRINCIPAIS ---

// 1. Carregar lista de sensores
async function carregarSensores() {
    try {
        const res = await fetch(`${API_URL}/sensores`);
        if(!res.ok) throw new Error("Erro ao buscar sensores");
        
        const sensores = await res.json();
        renderizarTabela(sensores);
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar sensores. Verifique a API.');
    }
}

// 2. Renderizar linhas da tabela
function renderizarTabela(sensores) {
    const tbody = document.getElementById('lista-sensores-body');
    tbody.innerHTML = ''; // Limpa tabela

    sensores.forEach(s => {
        const tr = document.createElement('tr');
        
        // Define classe do badge de status
        const statusClass = s.status === 'Ativado' ? 'badge-ativo' : 'badge-inativo';

        tr.innerHTML = `
            <td>${s.sensorName}</td>
            <td>${s.sensorType}</td>
            <td>${s.sala || '-'}</td>
            <td><span class="badge ${statusClass}">${s.status}</span></td>
            <td>
                <button class="action-btn edit-btn" onclick='preencherEdicao(${JSON.stringify(s)})' title="Editar">
                    <i class="mdi mdi-pencil"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deletarSensor(${s.id})" title="Desativar/Excluir">
                    <i class="mdi mdi-delete"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Salvar (Criar ou Editar)
async function salvarSensor(event) {
    event.preventDefault(); // Impede recarregamento da página

    // Captura os dados do form
    const id = document.getElementById('sensor-id').value;
    const payload = {
        sensorName: document.getElementById('sensor-name').value,
        sensorType: document.getElementById('sensor-type').value,
        uniqueAddress: document.getElementById('unique-address').value,
        sala: document.getElementById('sala').value,
        tempMin: document.getElementById('temp-min').value || null,
        tempMax: document.getElementById('temp-max').value || null,
        umidMin: document.getElementById('umid-min').value || null,
        umidMax: document.getElementById('umid-max').value || null,
        status: 'Ativado' // Padrão ao salvar via form
    };

    try {
        let url = `${API_URL}/sensores`;
        let method = 'POST';

        // Se tem ID, é uma EDIÇÃO (PUT)
        if (id) {
            url = `${API_URL}/sensores/${id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Falha ao salvar');

        alert('Sensor salvo com sucesso!');
        limparFormulario();
        carregarSensores(); // Recarrega a tabela

    } catch (error) {
        console.error(error);
        alert('Erro ao salvar sensor. Verifique os dados.');
    }
}

// 4. Preencher formulário para edição
// Essa função é chamada pelo botão de lápis na tabela
function preencherEdicao(sensor) {
    document.getElementById('sensor-id').value = sensor.id;
    document.getElementById('sensor-name').value = sensor.sensorName;
    document.getElementById('sensor-type').value = sensor.sensorType;
    document.getElementById('unique-address').value = sensor.uniqueAddress;
    document.getElementById('sala').value = sensor.sala || '';
    
    document.getElementById('temp-min').value = sensor.tempMin;
    document.getElementById('temp-max').value = sensor.tempMax;
    document.getElementById('umid-min').value = sensor.umidMin;
    document.getElementById('umid-max').value = sensor.umidMax;

    // Rola a página até o formulário
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}

// 5. Deletar (Desativar) Sensor
async function deletarSensor(id) {
    if (!confirm('Tem certeza que deseja desativar este sensor?')) return;

    try {
        const res = await fetch(`${API_URL}/sensores/${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('Erro ao deletar');

        carregarSensores(); // Atualiza a tabela
    } catch (error) {
        console.error(error);
        alert('Erro ao tentar desativar o sensor.');
    }
}

// 6. Limpar Formulário
function limparFormulario() {
    document.getElementById('sensor-form').reset();
    document.getElementById('sensor-id').value = '';
}

// Expõe as funções globais para o HTML poder chamar via onclick
window.preencherEdicao = preencherEdicao;
window.deletarSensor = deletarSensor;
window.limparFormulario = limparFormulario;