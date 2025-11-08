// Registra os plugins globalmente
Chart.register(ChartDataLabels, ChartAnnotation);

// ===== 1. DEFINIÇÃO DOS PARÂMETROS DA ISO =====
const ISO_RANGES = {
    'amostras': {
        temp: { min: 16, max: 20, label: 'Temp. Amostras' },
        umid: { min: 45, max: 60, label: 'Umid. Amostras' }
    },
    'geladeiras': {
        temp: { min: 2, max: 15, label: 'Temp. Geladeiras' },
        // Sem limite de umidade especificado, então usamos "infinito"
        umid: { min: -Infinity, max: Infinity, label: 'Umid. Geladeiras' }
    }
};

// ===== 2. BANCO DE DADOS FALSO (com dados para as duas salas) =====
const DADOS_FALSOS_DB = {
    'amostras': { // Dados para Sala de Amostras (16-20°C / 45-60%)
        '6h': {
            labels: ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
            temperaturas: [17.5, 18.0, 18.2, 20.5, 19.8, 19.5], // 20.5 está FORA
            umidades: [55, 56, 58, 61.0, 59, 57] // 61.0 está FORA
        },
        '24h': {
            labels: ["08:00", "12:00", "16:00", "20:00", "00:00", "04:00"],
            temperaturas: [16.5, 17.8, 18.5, 19.0, 15.8, 16.2], // 15.8 está FORA
            umidades: [44.0, 50, 55, 58, 52, 48] // 44.0 está FORA
        },
        '7d': {
            labels: ["Dia 1", "Dia 2", "Dia 3", "Dia 4", "Dia 5", "Dia 6", "Dia 7"],
            temperaturas: [18.0, 17.5, 19.0, 21.0, 16.0, 15.5, 18.2], // 21.0 e 15.5 FORA
            umidades: [50, 52, 48, 55, 62, 58, 55] // 62 FORA
        }
    },
    'geladeiras': { // Dados para Sala de Geladeiras (2-15°C)
        '6h': {
            labels: ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
            temperaturas: [4.5, 4.2, 5.0, 15.5, 4.0, 3.8], // 15.5 está FORA
            umidades: [70, 71, 72, 70, 69, 70] // Sem faixa, só para mostrar
        },
        '24h': {
            labels: ["08:00", "12:00", "16:00", "20:00", "00:00", "04:00"],
            temperaturas: [3.0, 5.5, 4.0, 1.8, 3.2, 2.5], // 1.8 está FORA
            umidades: [68, 70, 71, 72, 70, 69]
        },
        '7d': {
            labels: ["Dia 1", "Dia 2", "Dia 3", "Dia 4", "Dia 5", "Dia 6", "Dia 7"],
            temperaturas: [5.0, 4.1, 3.5, 2.2, 1.5, 16.0, 4.0], // 1.5 e 16.0 FORA
            umidades: [70, 71, 72, 70, 69, 70, 71]
        }
    }
};

// ===== 3. VARIÁVEIS DE ESTADO E GRÁFICO =====
let salaAtual = 'amostras'; // Começa na sala de amostras
let periodoAtual = '6h';   // Começa com filtro de 6h
let graficoTempInstancia = null;
let graficoUmidInstancia = null;

document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DOS SELETORES (Salas e Filtros) ---
    const botoesSala = document.querySelectorAll('.room-btn');
    const botoesFiltro = document.querySelectorAll('.filtro-btn');
    const tituloSala = document.getElementById('room-title');

    botoesSala.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesSala.forEach(btn => btn.classList.remove('active'));
            botao.classList.add('active');
            
            salaAtual = botao.dataset.room;
            tituloSala.innerText = `Monitorando: ${botao.innerText.trim()}`;
            
            // Limpa os alertas da sala anterior
            document.getElementById('lista-alertas').innerHTML = '';
            adicionarAlerta(`Carregando dados para ${botao.innerText.trim()}...`, 'info');
            
            atualizarDashboard();
        });
    });

    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesFiltro.forEach(btn => btn.classList.remove('active'));
            botao.classList.add('active');
            
            periodoAtual = botao.dataset.periodo;
            atualizarDashboard();
        });
    });

    // ===== 4. FUNÇÕES DE ATUALIZAÇÃO DO DASHBOARD =====

    /**
     * Função Mestra: Orquestra todas as atualizações
     */
    function atualizarDashboard() {
        // 1. Pega os limites ISO da sala atual
        const limites = ISO_RANGES[salaAtual];
        
        // 2. Pega os dados falsos para a sala e período atuais
        const dados = DADOS_FALSOS_DB[salaAtual][periodoAtual];
        
        // 3. Pega os dados "atuais" (simulados como o último da lista)
        const dadosAtuais = {
            temperatura: dados.temperaturas[dados.temperaturas.length - 1],
            umidade: dados.umidades[dados.umidades.length - 1]
        };
        
        // 4. Pega estatísticas (vamos simular com base nos dados do período)
        const dadosEstatisticos = {
            tempMedia: (dados.temperaturas.reduce((a, b) => a + b, 0) / dados.temperaturas.length).toFixed(1),
            tempMax: Math.max(...dados.temperaturas),
            tempMin: Math.min(...dados.temperaturas),
            umidMedia: (dados.umidades.reduce((a, b) => a + b, 0) / dados.umidades.length).toFixed(1),
            umidMax: Math.max(...dados.umidades),
            umidMin: Math.min(...dados.umidades)
        };
        
        // 5. Atualiza todos os componentes da tela
        carregarDadosAtuais(dadosAtuais, limites);
        carregarEstatisticas(dadosEstatisticos);
        carregarGraficoTemperatura(dados, limites.temp);
        carregarGraficoUmidade(dados, limites.umid);
    }

    /**
     * REQUISITO C: Adiciona um item ao Log de Alertas
     */
    function adicionarAlerta(mensagem, tipo = 'info') {
        const listaAlertas = document.getElementById('lista-alertas');
        const novoAlerta = document.createElement('li');
        novoAlerta.classList.add(`alerta-${tipo}`);
        
        const agora = new Date();
        const hora = agora.getHours().toString().padStart(2, '0');
        const min = agora.getMinutes().toString().padStart(2, '0');
        const seg = agora.getSeconds().toString().padStart(2, '0');
        
        novoAlerta.innerHTML = `<strong>[${hora}:${min}:${seg}]</strong> ${mensagem}`;
        listaAlertas.prepend(novoAlerta);
    }

    /**
     * REQUISITO A (Parcial) + C: Atualiza os cards de Tempo Real e checa Alertas
     */
    function carregarDadosAtuais(dados, limites) {
        document.getElementById('temp-atual').innerText = dados.temperatura;
        document.getElementById('umid-atual').innerText = dados.umidade;

        // Lógica de Alerta de Temperatura
        const cardTemp = document.getElementById('card-temp');
        if (dados.temperatura < limites.temp.min || dados.temperatura > limites.temp.max) {
            cardTemp.classList.add('alerta-iso');
            adicionarAlerta(`Temp. fora da faixa ISO: ${dados.temperatura}°C (Permitido: ${limites.temp.min}-${limites.temp.max}°C)`, 'critico');
        } else {
            cardTemp.classList.remove('alerta-iso');
        }
        
        // Lógica de Alerta de Umidade (só se a faixa não for infinita)
        const cardUmid = document.getElementById('card-umid');
        if (limites.umid.min > -Infinity && (dados.umidade < limites.umid.min || dados.umidade > limites.umid.max)) {
            cardUmid.classList.add('alerta-iso');
            adicionarAlerta(`Umid. fora da faixa ISO: ${dados.umidade}% (Permitido: ${limites.umid.min}-${limites.umid.max}%)`, 'aviso');
        } else {
            cardUmid.classList.remove('alerta-iso');
        }
    }

    /**
     * REQUISITO A (Completo): Atualiza os cards de Análise Estatística
     */
    function carregarEstatisticas(stats) {
        document.getElementById('temp-media').innerText = stats.tempMedia;
        document.getElementById('temp-max').innerText = stats.tempMax;
        document.getElementById('temp-min').innerText = stats.tempMin;
        document.getElementById('umid-media').innerText = stats.umidMedia;
        document.getElementById('umid-max').innerText = stats.umidMax;
        document.getElementById('umid-min').innerText = stats.umidMin;
    }

    /**
     * REQUISITO B: Desenha/Atualiza o gráfico de Temperatura (COM ALERTAS)
     */
    function carregarGraficoTemperatura(dados, limites) {
        const ctx = document.getElementById('grafico-temperatura').getContext('2d');
        if (graficoTempInstancia) graficoTempInstancia.destroy();
        
        // NOVO: Colore os pontos fora da faixa
        const pointColors = dados.temperaturas.map(temp => {
            return (temp < limites.min || temp > limites.max) ? 'rgba(217, 83, 79, 1)' : 'rgba(255, 99, 132, 1)';
        });
        const pointRadius = dados.temperaturas.map(temp => {
            return (temp < limites.min || temp > limites.max) ? 6 : 3; // Destaca o ponto
        });

        graficoTempInstancia = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: dados.labels, 
                datasets: [{
                    label: limites.label,
                    data: dados.temperaturas,
                    borderColor: 'rgba(255, 99, 132, 1)', 
                    tension: 0.1,
                    pointBackgroundColor: pointColors, // Cor dos pontos
                    pointRadius: pointRadius, // Raio dos pontos
                    pointHoverRadius: 8
                }]
            },
            options: {
                plugins: {
                    datalabels: { // Rótulos em cima dos pontos
                        align: 'top',
                        color: (context) => (context.dataset.pointBackgroundColor[context.dataIndex]), // Cor do rótulo
                        font: { weight: 'bold' },
                        formatter: v => v + '°C'
                    },
                    // NOVO: Linhas de Anotação da ISO
                    annotation: {
                        annotations: {
                            minLine: {
                                type: 'line', yMin: limites.min, yMax: limites.min,
                                borderColor: 'red', borderWidth: 2, borderDash: [5, 5],
                                label: { content: `Mín: ${limites.min}°C`, enabled: true, position: 'start', backgroundColor: 'rgba(255,0,0,0.1)' }
                            },
                            maxLine: {
                                type: 'line', yMin: limites.max, yMax: limites.max,
                                borderColor: 'red', borderWidth: 2, borderDash: [5, 5],
                                label: { content: `Máx: ${limites.max}°C`, enabled: true, position: 'start', backgroundColor: 'rgba(255,0,0,0.1)' }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * REQUISITO B: Desenha/Atualiza o gráfico de Umidade (COM ALERTAS)
     */
    function carregarGraficoUmidade(dados, limites) {
        const ctx = document.getElementById('grafico-umidade').getContext('2d');
        if (graficoUmidInstancia) graficoUmidInstancia.destroy();

        // NOVO: Colore os pontos fora da faixa
        const pointColors = dados.umidades.map(umid => {
            return (umid < limites.min || umid > limites.max) ? 'rgba(217, 83, 79, 1)' : 'rgba(54, 162, 235, 1)';
        });
        const pointRadius = dados.umidades.map(umid => {
            return (umid < limites.min || umid > limites.max) ? 6 : 3;
        });
        
        // NOVO: Só adiciona anotações se o limite não for infinito
        let annotations = {};
        if (limites.min > -Infinity) {
            annotations.minLine = {
                type: 'line', yMin: limites.min, yMax: limites.min,
                borderColor: 'red', borderWidth: 2, borderDash: [5, 5],
                label: { content: `Mín: ${limites.min}%`, enabled: true, position: 'start', backgroundColor: 'rgba(255,0,0,0.1)' }
            };
            annotations.maxLine = {
                type: 'line', yMin: limites.max, yMax: limites.max,
                borderColor: 'red', borderWidth: 2, borderDash: [5, 5],
                label: { content: `Máx: ${limites.max}%`, enabled: true, position: 'start', backgroundColor: 'rgba(255,0,0,0.1)' }
            };
        }

        graficoUmidInstancia = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: dados.labels, 
                datasets: [{
                    label: limites.label,
                    data: dados.umidades,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    tension: 0.1,
                    pointBackgroundColor: pointColors,
                    pointRadius: pointRadius,
                    pointHoverRadius: 8
                }]
            },
            options: {
                plugins: {
                    datalabels: {
                        align: 'top',
                        color: (context) => (context.dataset.pointBackgroundColor[context.dataIndex]),
                        font: { weight: 'bold' },
                        formatter: v => v + '%'
                    },
                    annotation: {
                        annotations: annotations
                    }
                }
            }
        });
    }

    // --- EXECUÇÃO INICIAL ---
    // Limpa a mensagem de "iniciando" e carrega os dados da sala padrão
    document.getElementById('lista-alertas').innerHTML = '';
    atualizarDashboard();

});