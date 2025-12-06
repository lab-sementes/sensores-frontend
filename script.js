// ---------------------
// Configurações
// ---------------------
const API_URL = 'https://api.thalesgmartins.com.br';

// ---------------------
// Carregar Sensores
// ---------------------
async function carregarDadosSensores() {
    try {
        const res = await fetch(`${API_URL}/sensores`);
        return todosSensores = await res.json();
    } catch (error) {
        console.error(error);
    }
}

/* ==========================================================================
   MAPEAMENTO DOS SENSORES
   ========================================================================== */
const SENSOR_IDS = {
    'amostras': 6,
    'geladeiras': 7
};

const ISO_RANGES = {
    'amostras': {
        temp: { min: 18, max: 24 },
        hum: { min: 40, max: 60 }
    },
    'geladeiras': {
        temp: { min: 2, max: 8 },
        hum: { min: 0, max: 100 }
    }
};

// Variáveis globais
let salaAtual = 'amostras';
let periodoAtual = '24h';
let graficoTemp = null;
let graficoUmid = null;

// ---------------------
// Inicialização
// ---------------------
document.addEventListener('DOMContentLoaded', () => {

    // Botões de salas
    document.querySelectorAll('.room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            salaAtual = e.target.dataset.room;
            atualizarDashboard();
        });
    });

    // Botões de filtros
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            periodoAtual = e.target.dataset.periodo;
            atualizarDashboard();
        });
    });

    // Primeira carga
    atualizarDashboard();

    // Atualização automática
    setInterval(atualizarDashboard, 30000);
});

// ---------------------
// Atualização do Dashboard
// ---------------------
async function atualizarDashboard() {
    const sensorId = SENSOR_IDS[salaAtual];
    const limites = ISO_RANGES[salaAtual];

    if (!sensorId) {
        console.error(`Erro: Sala "${salaAtual}" não possui sensor configurado.`);
        return;
    }

    try {
        console.log(`Buscando dados do sensor ${sensorId}...`);

        // Última medição
        const resAtual = await fetch(`${API_URL}/measurements/${sensorId}/latest`);
        if (!resAtual.ok) throw new Error(`Erro API ${resAtual.status} ao buscar última leitura.`);

        const dadosAtuais = await resAtual.json();

        // Atualiza cards
        document.getElementById('temp-atual').innerText =
            dadosAtuais.temperature ? dadosAtuais.temperature.toFixed(1) : '--';

        document.getElementById('umid-atual').innerText =
            dadosAtuais.humidity ? dadosAtuais.humidity.toFixed(1) : '--';

        verificarAlertas(dadosAtuais.temperature, limites.temp, 'card-temp');

        // Escolhe bucket
        let bucket = '1 hour';
        if (periodoAtual === '6h') bucket = '10 minutes';
        if (periodoAtual === '24h') bucket = '1 hour';
        if (periodoAtual === '7d') bucket = '6 hours';

        // Histórico
        const resHist = await fetch(`${API_URL}/measurements/${sensorId}/aggregates?bucket=${bucket}`);
        const historico = await resHist.json();

        if (!Array.isArray(historico) || historico.length === 0) {
            console.warn("Histórico vazio.");
            return;
        }

        // ---------------------
        // Extração dos dados
        // ---------------------
        const labels = historico.map(h => formatarHora(h.hora));

        const temps = historico
            .map(h => Number(h.media))
            .filter(v => !isNaN(v));

        const hums = historico
            .map(h => Number(h.media_umidade))
            .filter(v => !isNaN(v));

        // Estatísticas
        atualizarEstatisticas(temps, hums);

        // Gráficos
        renderizarGraficoTemperatura(labels, temps, limites.temp);
        renderizarGraficoUmidade(labels, hums, limites.hum);

    } catch (erro) {
        console.error("Erro na API:", erro);
        document.getElementById('temp-atual').innerText = "Erro";
    }
}

// ---------------------
// Estatísticas
// ---------------------
function atualizarEstatisticas(temps, hums) {
    const media = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    // Temperatura
    document.getElementById("temp-media").innerText = media(temps).toFixed(1);
    document.getElementById("temp-max").innerText = Math.max(...temps).toFixed(1);
    document.getElementById("temp-min").innerText = Math.min(...temps).toFixed(1);

    // Umidade
    document.getElementById("umid-media").innerText = media(hums).toFixed(1);
    document.getElementById("umid-max").innerText = Math.max(...hums).toFixed(1);
    document.getElementById("umid-min").innerText = Math.min(...hums).toFixed(1);
}

// ---------------------
// Gráfico Temperatura
// ---------------------
function renderizarGraficoTemperatura(labels, dataTemp, limites) {
    const ctx = document.getElementById('grafico-temperatura').getContext('2d');

    if (graficoTemp) graficoTemp.destroy();

    graficoTemp = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Temperatura (°C)',
                data: dataTemp,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                annotation: {
                    annotations: {
                        min: {
                            type: 'line',
                            yMin: limites.min,
                            yMax: limites.min,
                            borderColor: 'red',
                            borderDash: [5, 5]
                        },
                        max: {
                            type: 'line',
                            yMin: limites.max,
                            yMax: limites.max,
                            borderColor: 'red',
                            borderDash: [5, 5]
                        }
                    }
                }
            }
        }
    });
}

// ---------------------
// Gráfico Umidade
// ---------------------
function renderizarGraficoUmidade(labels, dataHum, limites) {
    const ctx = document.getElementById('grafico-umidade').getContext('2d');

    if (graficoUmid) graficoUmid.destroy();

    graficoUmid = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Umidade (%)',
                data: dataHum,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.15)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    suggestedMin: limites.min - 5,
                    suggestedMax: limites.max + 5
                }
            }
        }
    });
}

// ---------------------
// Funções úteis
// ---------------------
function verificarAlertas(valor, limites, elementoId) {
    // lógica futura
}

function formatarHora(isoString) {
    if (!isoString) return "";
    const data = new Date(isoString);
    return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}
