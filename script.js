// ---------------------
// Configurações
// ---------------------
const API_URL = 'https://api.thalesgmartins.com.br';


/**
 * Faz o fetch do endpoint dos sensores.
 */
async function carregarDadosSensores() {
    try {
        const res = await fetch(`${API_URL}/sensores`)
        return todosSensores = await res.json();
    } catch (error) {
        console.error(error);
    }
}

/* ==========================================================================
   MODAL GERENCIAMENTO DE SENSORES
   ========================================================================== */


// // ATUALIZADO: IDs reais conforme sua imagem
// const SENSOR_IDS = {
//     'amostras': 6,    // ID 6 = DHT na sala de sementes
//     'geladeiras': 7,  // ID 7 = DHT na sala das geladeiras
//     // IDs extras caso você crie botões para eles no futuro:
//     // 'gl1': 3,
//     // 'gl2': 4,
//     // 'gl3': 5
// };

// // Limites de Temperatura e Umidade
// const ISO_RANGES = {
//     'amostras': {
//         temp: { min: 18, max: 24 }, 
//         hum: { min: 40, max: 60 }
//     },
//     'geladeiras': {
//         temp: { min: 2, max: 8 },
//         hum: { min: 0, max: 100 }
//     }
// };

// // Variáveis de Estado Global
// let salaAtual = 'amostras';
// let periodoAtual = '24h';
// let graficoTemp = null; 

// // --- 2. INICIALIZAÇÃO ---
// document.addEventListener('DOMContentLoaded', () => {
//     // Configura os botões de navegação (Salas)
//     document.querySelectorAll('.nav-btn').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
//             e.target.classList.add('active');
            
//             // Pega o nome da sala (ex: "amostras") do HTML
//             salaAtual = e.target.dataset.room; 
//             atualizarDashboard();
//         });
//     });

//     // Configura os botões de filtro de tempo (24h, 6h, etc)
//     document.querySelectorAll('.filter-btn').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
//             e.target.classList.add('active');
//             periodoAtual = e.target.innerText.toLowerCase(); 
//             atualizarDashboard();
//         });
//     });

//     // Carrega a primeira vez
//     atualizarDashboard();
    
//     // Atualiza automaticamente a cada 30 segundos
//     setInterval(atualizarDashboard, 30000);
// });

// // --- 3. FUNÇÃO PRINCIPAL (CONECTADA NA API) ---
// async function atualizarDashboard() {
//     const sensorId = SENSOR_IDS[salaAtual];
//     const limites = ISO_RANGES[salaAtual];

//     // Se o botão HTML tiver um nome errado que não está no SENSOR_IDS
//     if (!sensorId) {
//         console.error(`Erro: Não existe ID configurado para a sala "${salaAtual}"`);
//         return;
//     }

//     try {
//         console.log(`Buscando dados para Sensor ID: ${sensorId}...`); // Log para debug

//         // A) Busca a última medição
//         const resAtual = await fetch(`${API_URL}/measurements/${sensorId}/latest`);
        
//         if (!resAtual.ok) {
//             throw new Error(`Erro API ${resAtual.status}: Falha ao buscar sensor ${sensorId}`);
//         }
        
//         const dadosAtuais = await resAtual.json();

//         // Atualiza os números na tela
//         document.getElementById('temp-valor').innerText = dadosAtuais.temperature ? dadosAtuais.temperature.toFixed(1) + '°C' : '--';
//         document.getElementById('hum-valor').innerText = dadosAtuais.humidity ? dadosAtuais.humidity.toFixed(1) + '%' : '--';

//         // Verifica alertas
//         verificarAlertas(dadosAtuais.temperature, limites.temp, 'card-temp');
        
//         // B) Busca histórico para o Gráfico
//         let bucket = '1 hour';
//         if (periodoAtual === '6h') bucket = '10 minutes';
//         if (periodoAtual === '24h') bucket = '1 hour';
        
//         const resHist = await fetch(`${API_URL}/measurements/${sensorId}/aggregates?bucket=${bucket}`);
//         const historico = await resHist.json();

//         // Prepara dados para o gráfico
//         const labels = historico.map(h => formatarHora(h.hora)).reverse();
//         const temps = historico.map(h => h.media).reverse();

//         renderizarGrafico(labels, temps, limites.temp);

//     } catch (erro) {
//         console.error("Erro na comunicação com a API:", erro);
//         // Opcional: mostrar aviso na tela se falhar
//         document.getElementById('temp-valor').innerText = "Erro";
//     }
// }

// // --- 4. FUNÇÕES AUXILIARES ---

// function renderizarGrafico(labels, dataTemp, limites) {
//     const ctx = document.getElementById('mainChart').getContext('2d');

//     if (graficoTemp) {
//         graficoTemp.destroy();
//     }

//     graficoTemp = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: labels,
//             datasets: [{
//                 label: 'Temperatura (°C)',
//                 data: dataTemp,
//                 borderColor: '#2ecc71',
//                 backgroundColor: 'rgba(46, 204, 113, 0.1)',
//                 tension: 0.4,
//                 fill: true
//             }]
//         },
//         options: {
//             responsive: true,
//             plugins: {
//                 annotation: {
//                     annotations: {
//                         lineMin: {
//                             type: 'line',
//                             yMin: limites.min,
//                             yMax: limites.min,
//                             borderColor: 'red',
//                             borderWidth: 1,
//                             borderDash: [5, 5],
//                             label: { enabled: true, content: 'Min', position: 'start' }
//                         },
//                         lineMax: {
//                             type: 'line',
//                             yMin: limites.max,
//                             yMax: limites.max,
//                             borderColor: 'red',
//                             borderWidth: 1,
//                             borderDash: [5, 5],
//                             label: { enabled: true, content: 'Max', position: 'start' }
//                         }
//                     }
//                 }
//             },
//             scales: {
//                 y: {
//                     suggestedMin: limites.min - 5,
//                     suggestedMax: limites.max + 5
//                 }
//             }
//         }
//     });
// }

// function verificarAlertas(valor, limites, elementoId) {
//     // Aqui você pode adicionar lógica visual (ex: mudar cor do card)
// }

// function formatarHora(isoString) {
//     if(!isoString) return "";
//     const data = new Date(isoString);
//     return `${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
// }