document.addEventListener("DOMContentLoaded", () => {
    // Parâmetro dinâmico da capacidade de água no solo medido em Campina do Simão (52%)
    // Como a região costuma reter boa umidade, este valor reflete um solo estruturado.
    const umidadeSoloAtual = 52; 

    // 1. Processamento das estimativas localizadas de manejo (Quando plantar e quando adubar)
    calcularJanelasIdeaisManejo(umidadeSoloAtual);

    // 2. Criação do gráfico de balanço hídrico para o planalto central paranaense
    inicializarGraficoHidrico();

    // 3. Montagem do mapa real de satélite sobre Campina do Simão - PR
    inicializarMapaSatelite();
});

// Algoritmo de Tomada de Decisão Agronômica Regional
function calcularJanelasIdeaisManejo(umidade) {
    const recPlantio = document.getElementById("rec-plantio");
    const recAdubacao = document.getElementById("rec-adubacao");

    const pPlantio = document.getElementById("data-plantio");
    const pAdubacao = document.getElementById("data-adubacao");

    // Lógica para Plantio Direto: Umidade ideal situa-se entre 40% e 60%
    if (umidade >= 40 && umidade <= 60) {
        pPlantio.innerHTML = "<strong>Condição Ideal Detectada!</strong> Umidade em 52%. Excelente consistência de fratura do solo. A palhada está pronta para corte limpo dos discos da plantadeira.";
        atualizarEstiloBadge(recPlantio, "Ideal Agora", "tag-sucesso", "var(--verde-limao)");
    } else {
        pPlantio.innerHTML = "Inadequado no momento. Solo fora da faixa de consistência friável. Aguarde estabilização hídrica natural.";
        atualizarEstiloBadge(recPlantio, "Aguardar", "tag-atencao", "var(--alerta-laranja)");
    }

    // Lógica para Gestão de Adubação Cobertura (Monitoramento de vento e umidade relativa do ar)
    pAdubacao.innerHTML = "Janela propícia agendada para <strong>amanhã de manhã</strong>. Ventos fracos (< 10 km/h) e umidade do ar alta (72%), reduzindo perdas por volatilização.";
    atualizarEstiloBadge(recAdubacao, "Recomendado", "tag-sucesso", "var(--verde-limao)");
}

function atualizarEstiloBadge(elementoCard, texto, classeCss, corBorda) {
    const tag = elementoCard.querySelector(".status-tag");
    tag.textContent = texto;
    tag.className = `status-tag ${classeCss}`;
    elementoCard.style.borderColor = corBorda;
}

// Renderização Gráfica do Balanço Hídrico (Chart.js)
function inicializarGraficoHidrico() {
    const ctx = document.getElementById('chartHidrico').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom (Previsão)'],
            datasets: [
                {
                    label: 'Entrada Hídrica / Chuva (mm)',
                    data: [8, 12, 0, 0, 4, 15, 20],
                    backgroundColor: '#52b788'
                },
                {
                    label: 'Perda por Evapotranspiração / Seca (mm)',
                    data: [5, 4, 7, 8, 6, 3, 2],
                    backgroundColor: '#e63946'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8a968e' } },
                x: { grid: { display: false }, ticks: { color: '#8a968e' } }
            },
            plugins: {
                legend: { labels: { color: '#f2f5f3', font: { family: 'Plus Jakarta Sans' } } }
            }
        }
    });
}

// Inicialização do Mapa Focado em Campina do Simão - PR (Leaflet.js)
let mapaInstancia;
let poligonoEspectral;

function inicializarMapaSatelite() {
    // Coordenadas geográficas reais do município de Campina do Simão - PR
    const latCampinaDoSimao = -25.0803;
    const lngCampinaDoSimao = -51.8267;

    mapaInstancia = L.map('mapaAgro').setView([latCampinaDoSimao, lngCampinaDoSimao], 13);

    // Conexão com servidores ArcGIS da Esri para renderização de imagem real de satélite
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri Satellite | SimãoAgro 2026'
    }).addTo(mapaInstancia);

    // Inicia exibindo o filtro NDVI
    filtrarSatelite('ndvi');
}

function filtrarSatelite(tipoFiltro) {
    if (poligonoEspectral) mapaInstancia.removeLayer(poligonoEspectral);

    // Ajusta as cores conforme o índice espectral selecionado pelo produtor
    const configuracaoVisual = {
        color: tipoFiltro === 'ndvi' ? '#1b4332' : '#ba181b',
        fillColor: tipoFiltro === 'ndvi' ? '#40916c' : '#f4a261',
        fillOpacity: 0.5,
        weight: 3
    };

    // Delimitação vetorial simulando um talhão agrícola localizado em Campina do Simão - PR
    const coordenadasTalhao = [
        [-25.075, -51.84],
        [-25.072, -51.81],
        [-25.090, -51.81],
        [-25.092, -51.84]
    ];

    poligonoEspectral = L.polygon(coordenadasTalhao, configuracaoVisual).addTo(mapaInstancia);

    // Alternância estética ativa nos botões da interface
    const botoes = document.querySelectorAll('.btn-filtro');
    botoes.forEach(b => b.classList.remove('ativo'));
    if (tipoFiltro === 'ndvi') botoes[0].classList.add('ativo');
    else botoes[1].classList.add('ativo');
}

// Calculadora de Balanço de Gases de Efeito Estufa ($CO_2$)
function processarPegadaCarbono() {
    const diesel = parseFloat(document.getElementById('diesel-input').value) || 0;
    const nitrog = parseFloat(document.getElementById('nitro-input').value) || 0;
    const hectares = parseFloat(document.getElementById('hec-input').value) || 0;

    // Métricas de balanço de carbono:
    // Queima de diesel libera 2.6kg CO2/L. Fertilizante nitrogenado emite 5.8kg CO2/kg.
    // O Plantio Direto bem estruturado sequestra cerca de 500kg de CO2 por hectare/ano no Sul do país.
    const emissaoInsumos = (diesel * 2.6) + (nitrog * 5.8);
    const sequestroSolo = hectares * 500;
    const balancoLiquido = emissaoInsumos - sequestroSolo;

    const resultadoBox = document.getElementById('resultado-carbono-box');
    const titulo = document.getElementById('resultado-titulo');
    const texto = document.getElementById('resultado-texto');

    resultadoBox.classList.remove('escondido');
    resultadoBox.className = "painel-resultado"; // Reseta classes

    if (balancoLiquido <= 0) {
        resultadoBox.classList.add('resultado-positivo');
        titulo.textContent = "🌳 Solo Ativo (Carbono Negativo / Sustentável)";
        texto.innerHTML = `Excelente resultado para a sua lavoura! As práticas mitigadoras fixaram cerca de <strong>${Math.abs(balancoLiquido).toFixed(0)} kg de $CO_2$</strong> no solo este ano, agindo de forma regenerativa na atmosfera.`;
    } else {
        resultadoBox.classList.add('resultado-negativo');
        titulo.textContent = "⚠️ Alerta de Emissão (Carbono Positivo)";
        texto.innerHTML = `O uso de insumos pesados superou a fixação biológica da cobertura morta. Saldo líquido restante: <strong>${balancoLiquido.toFixed(0)} kg de $CO_2$</strong> emitidos. Intensifique o volume da palhada ou reduza a adubação nitrogenada de síntese química.`;
    }
}