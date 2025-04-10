// Configurações e variáveis globais
const API_BASE_URL = '/api';
let currentPair = 'all';
let currentTimeframe = 'D1';
let signalsData = {};

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar a hora da última atualização
    updateLastUpdateTime();
    
    // Carregar sinais iniciais
    loadSignals();
    
    // Configurar listeners de eventos
    setupEventListeners();
    
    // Atualizar sinais a cada 5 minutos
    setInterval(loadSignals, 5 * 60 * 1000);
});

// Configurar listeners de eventos
function setupEventListeners() {
    // Botão de atualização
    document.getElementById('btnUpdate').addEventListener('click', loadSignals);
    
    // Seleção de par de moedas
    document.getElementById('selectPair').addEventListener('change', function() {
        currentPair = this.value;
        filterSignals();
    });
    
    // Seleção de timeframe
    document.getElementById('selectTimeframe').addEventListener('change', function() {
        currentTimeframe = this.value;
        filterSignals();
    });
    
    // Botão de histórico
    document.getElementById('btnHistory').addEventListener('click', function() {
        loadHistoryData();
        const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
        historyModal.show();
    });
    
    // Filtros do histórico
    document.getElementById('historyPairSelect').addEventListener('change', filterHistoryData);
    document.getElementById('historyTimeframeSelect').addEventListener('change', filterHistoryData);
    
    // Delegação de eventos para detalhes do sinal (para elementos dinâmicos)
    document.getElementById('signalsContainer').addEventListener('click', function(e) {
        const detailsBtn = e.target.closest('.btn-outline-primary');
        if (detailsBtn) {
            e.preventDefault();
            const card = detailsBtn.closest('.signal-card');
            const pair = card.getAttribute('data-pair');
            const timeframe = card.getAttribute('data-timeframe');
            showSignalDetails(pair, timeframe);
        }
    });
}

// Carregar sinais do servidor
function loadSignals() {
    // Em um ambiente real, isso seria uma chamada AJAX para o backend
    // Simulando dados para demonstração
    fetch(`${API_BASE_URL}/forex/signals`)
        .then(response => {
            // Simulando resposta para demonstração
            return {
                timestamp: new Date().toISOString(),
                signals: generateMockSignals()
            };
        })
        .then(data => {
            signalsData = data;
            updateLastUpdateTime(new Date());
            renderSignals(data.signals);
        })
        .catch(error => {
            console.error('Erro ao carregar sinais:', error);
            // Usar dados de exemplo em caso de erro
            const mockData = {
                timestamp: new Date().toISOString(),
                signals: generateMockSignals()
            };
            signalsData = mockData;
            updateLastUpdateTime(new Date());
            renderSignals(mockData.signals);
        });
}

// Gerar sinais simulados para demonstração
function generateMockSignals() {
    const pairs = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/BRL'];
    const signals = ['COMPRA', 'VENDA', 'NEUTRO'];
    const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
    
    const mockSignals = [];
    
    pairs.forEach(pair => {
        const signal = signals[Math.floor(Math.random() * signals.length)];
        const probability = (50 + Math.random() * 40).toFixed(1);
        const price = (1 + Math.random() * 4).toFixed(4);
        
        // Criar data/hora aleatória nas últimas 24 horas
        const date = new Date();
        date.setHours(date.getHours() - Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        
        mockSignals.push({
            pair: pair,
            timeframe: 'D1',
            signal: signal,
            probability: parseFloat(probability),
            price: parseFloat(price),
            timestamp: date.toISOString(),
            features: {
                rsi: (30 + Math.random() * 40).toFixed(1),
                macd: (Math.random() * 0.01 - 0.005).toFixed(4),
                ma_20: (parseFloat(price) - 0.01 + Math.random() * 0.02).toFixed(4),
                bb_upper: (parseFloat(price) + 0.05 + Math.random() * 0.02).toFixed(4),
                bb_lower: (parseFloat(price) - 0.05 - Math.random() * 0.02).toFixed(4)
            },
            sentiment_analysis: {
                overall_sentiment: (Math.random() * 0.6 - 0.3).toFixed(2),
                economic_indicators: (Math.random() * 0.6 - 0.3).toFixed(2),
                central_bank_policies: (Math.random() * 0.6 - 0.3).toFixed(2),
                geopolitical_events: (Math.random() * 0.6 - 0.3).toFixed(2),
                market_liquidity: (Math.random() * 0.6 - 0.3).toFixed(2)
            },
            upcoming_events: [
                {
                    event: 'Decisão de Taxa de Juros',
                    date: new Date(date.getTime() + 86400000 * 5).toISOString().split('T')[0],
                    impact: 'Alto'
                },
                {
                    event: 'Relatório de Emprego',
                    date: new Date(date.getTime() + 86400000 * 2).toISOString().split('T')[0],
                    impact: 'Alto'
                }
            ]
        });
    });
    
    return mockSignals;
}

// Renderizar sinais na interface
function renderSignals(signals) {
    const container = document.getElementById('signalsContainer');
    container.innerHTML = '';
    
    // Filtrar sinais com base nas seleções atuais
    const filteredSignals = filterSignalsBySelections(signals);
    
    if (filteredSignals.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Nenhum sinal encontrado para os critérios selecionados.</p></div>';
        return;
    }
    
    filteredSignals.forEach(signal => {
        const card = createSignalCard(signal);
        container.appendChild(card);
    });
}

// Filtrar sinais com base nas seleções do usuário
function filterSignalsBySelections(signals) {
    return signals.filter(signal => {
        if (currentPair !== 'all' && signal.pair !== currentPair) {
            return false;
        }
        if (signal.timeframe !== currentTimeframe) {
            return false;
        }
        return true;
    });
}

// Filtrar sinais já renderizados
function filterSignals() {
    if (!signalsData.signals) return;
    renderSignals(signalsData.signals);
}

// Criar card de sinal
function createSignalCard(signal) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    const date = new Date(signal.timestamp);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    let signalBadgeClass = '';
    if (signal.signal === 'COMPRA') {
        signalBadgeClass = 'buy';
    } else if (signal.signal === 'VENDA') {
        signalBadgeClass = 'sell';
    } else {
        signalBadgeClass = 'neutral';
    }
    
    col.innerHTML = `
        <div class="card signal-card" data-pair="${signal.pair}" data-timeframe="${signal.timeframe}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">${signal.pair}</h5>
                <span class="badge bg-secondary">${getTimeframeName(signal.timeframe)}</span>
            </div>
            <div class="card-body">
                <div class="signal-badge ${signalBadgeClass}">${signal.signal}</div>
                <div class="row mt-3">
                    <div class="col-6">
                        <p class="signal-label">Preço Atual</p>
                        <p class="signal-value">${signal.price}</p>
                    </div>
                    <div class="col-6">
                        <p class="signal-label">Probabilidade</p>
                        <p class="signal-value">${signal.probability}%</p>
                    </div>
                </div>
                <div class="signal-time mt-2">${formattedDate}</div>
                <a href="#" class="btn btn-outline-primary btn-sm mt-3 w-100">Ver Detalhes</a>
            </div>
        </div>
    `;
    
    return col;
}

// Mostrar detalhes do sinal
function showSignalDetails(pair, timeframe) {
    // Encontrar o sinal correspondente
    const signal = signalsData.signals.find(s => s.pair === pair && s.timeframe === timeframe);
    
    if (!signal) {
        console.error('Sinal não encontrado:', pair, timeframe);
        return;
    }
    
    // Preencher o modal com os detalhes do sinal
    document.getElementById('modalPair').textContent = signal.pair;
    document.getElementById('modalTimeframe').textContent = getTimeframeName(signal.timeframe);
    
    let signalBadgeClass = '';
    if (signal.signal === 'COMPRA') {
        signalBadgeClass = 'bg-success';
    } else if (signal.signal === 'VENDA') {
        signalBadgeClass = 'bg-danger';
    } else {
        signalBadgeClass = 'bg-secondary';
    }
    
    document.getElementById('modalSignal').innerHTML = `<span class="badge ${signalBadgeClass}">${signal.signal}</span>`;
    document.getElementById('modalPrice').textContent = signal.price;
    document.getElementById('modalProbability').textContent = `${signal.probability}%`;
    
    const date = new Date(signal.timestamp);
    document.getElementById('modalTimestamp').textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    // Preencher indicadores técnicos
    const technicalIndicatorsContainer = document.getElementById('technicalIndicators');
    technicalIndicatorsContainer.innerHTML = '';
    
    if (signal.features) {
        // RSI
        const rsiValue = parseFloat(signal.features.rsi);
        let rsiSignal = 'Neutro';
        let rsiBadgeClass = 'bg-warning text-dark';
        
        if (rsiValue > 70) {
            rsiSignal = 'Venda';
            rsiBadgeClass = 'bg-danger';
        } else if (rsiValue < 30) {
            rsiSignal = 'Compra';
            rsiBadgeClass = 'bg-success';
        }
        
        technicalIndicatorsContainer.innerHTML += `
            <tr>
                <td>RSI (14)</td>
                <td>${rsiValue}</td>
                <td><span class="badge ${rsiBadgeClass}">${rsiSignal}</span></td>
            </tr>
        `;
        
        // MACD
        const macdValue = parseFloat(signal.features.macd);
        let macdSignal = 'Neutro';
        let macdBadgeClass = 'bg-warning text-dark';
        
        if (macdValue > 0.001) {
            macdSignal = 'Compra';
            macdBadgeClass = 'bg-success';
        } else if (macdValue < -0.001) {
            macdSignal = 'Venda';
            macdBadgeClass = 'bg-danger';
        }
        
        technicalIndicatorsContainer.innerHTML += `
            <tr>
                <td>MACD</td>
                <td>${macdValue}</td>
                <td><span class="badge ${macdBadgeClass}">${macdSignal}</span></td>
            </tr>
        `;
        
        // Média Móvel
        if (signal.features.ma_20) {
            const maValue = parseFloat(signal.features.ma_20);
            let maSignal = 'Neutro';
            let maBadgeClass = 'bg-warning text-dark';
            
            if (signal.price > maValue) {
                maSignal = 'Compra';
                maBadgeClass = 'bg-success';
            } else if (signal.price < maValue) {
                maSignal = 'Venda';
                maBadgeClass = 'bg-danger';
            }
            
            technicalIndicatorsContainer.innerHTML += `
                <tr>
                    <td>Média Móvel (20)</td>
                    <td>${maValue}</td>
                    <td><span class="badge ${maBadgeClass}">${maSignal}</span></td>
                </tr>
            `;
        }
        
        // Bandas de Bollinger
        if (signal.features.bb_upper && signal.features.bb_lower) {
            const bbUpper = parseFloat(signal.features.bb_upper);
            const bbLower = parseFloat(signal.features.bb_lower);
            let bbSignal = 'Neutro';
            let bbBadgeClass = 'bg-warning text-dark';
            
            if (signal.price > bbUpper) {
                bbSignal = 'Venda';
                bbBadgeClass = 'bg-danger';
            } else if (signal.price < bbLower) {
                bbSignal = 'Compra';
                bbBadgeClass = 'bg-success';
            }
            
            technicalIndicatorsContainer.innerHTML += `
                <tr>
                    <td>Bandas de Bollinger</td>
                    <td>Superior: ${bbUpper}<br>Inferior: ${bbLower}</td>
                    <td><span class="badge ${bbBadgeClass}">${bbSignal}</span></td>
                </tr>
            `;
        }
    }
    
    // Preencher eventos econômicos
    const economicEventsContainer = document.getElementById('economicEvents');
    economicEventsContainer.innerHTML = '';
    
    if (signal.upcoming_events && signal.upcoming_events.length > 0) {
        signal.upcoming_events.forEach(event => {
            let impactBadgeClass = 'bg-secondary';
            if (event.impact === 'Alto') {
                impactBadgeClass = 'bg-danger';
            } else if (event.impact === 'Médio') {
                impactBadgeClass = 'bg-warning text-dark';
            }
            
            economicEventsContainer.innerHTML += `
                <li class="list-group-item">
                    <div class="d-flex justify-content-between">
                        <span>${event.event}</span>
                        <span class="badge ${impactBadgeClass}">${event.impact} Impacto</span>
                    </div>
                    <small class="text-muted">${event.date}</small>
                </li>
            `;
        });
    } else {
        economicEventsContainer.innerHTML = '<li class="list-group-item">Nenhum evento econômico relevante encontrado.</li>';
    }
    
    // Renderizar gráfico de sentimento
    renderSentimentChart(signal.sentiment_analysis);
    
    // Exibir o modal
    const signalDetailsModal = new bootstrap.Modal(document.getElementById('signalDetailsModal'));
    signalDetailsModal.show();
}

// Renderizar gráfico de sentimento
function renderSentimentChart(sentimentData) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.sentimentChart) {
        window.sentimentChart.destroy();
    }
    
    if (!sentimentData) {
        return;
    }
    
    const labels = [
        'Sentimento Geral',
        'Indicadores Econômicos',
        'Políticas de Bancos Centrais',
        'Eventos Geopolíticos',
        'Liquidez de Mercado'
    ];
    
    const values = [
        parseFloat(sentimentData.overall_sentiment) * 100,
        parseFloat(sentimentData.economic_indicators) * 100,
        parseFloat(sentimentData.central_bank_policies) * 100,
        parseFloat(sentimentData.geopolitical_events) * 100,
        parseFloat(sentimentData.market_liquidity) * 100
    ];
    
    const colors = values.map(value => {
        if (value > 0) {
            return 'rgba(40, 167, 69, 0.7)';  // Verde para positivo
        } else {
            return 'rgba(220, 53, 69, 0.7)';  // Vermelho para negativo
        }
    });
    
    window.sentimentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sentimento (%)',
                data: values,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: -100,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1) + '%';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Carregar dados de histórico
function loadHistoryData() {
    // Em um ambiente real, isso seria uma chamada AJAX para o backend
    // Simulando dados para demonstração
    const mockHistory = generateMockHistoryData();
    
    // Atualizar estatísticas
    document.getElementById('successRate').textContent = `${mockHistory.successRate}%`;
    document.getElementById('totalSignals').textContent = mockHistory.totalSignals;
    document.getElementById('verifiedSignals').textContent = mockHistory.verifiedSignals;
    
    // Renderizar tabela de histórico
    renderHistoryTable(mockHistory.signals);
    
    // Armazenar dados para filtragem
    window.historyData = mockHistory;
}

// Gerar dados de histórico simulados
function generateMockHistoryData() {
    const pairs = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/BRL'];
    const signals = ['COMPRA', 'VENDA', 'NEUTRO'];
    const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
    const results = ['Acerto', 'Erro'];
    
    const mockSignals = [];
    let successCount = 0;
    const totalCount = 50;
    
    for (let i = 0; i < totalCount; i++) {
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const signal = signals[Math.floor(Math.random() * signals.length)];
        const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
        const price = (1 + Math.random() * 4).toFixed(4);
        const probability = (50 + Math.random() * 40).toFixed(1);
        
        // Criar data/hora aleatória nos últimos 30 dias
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        
        // Determinar resultado (mais acertos que erros para parecer bom)
        const result = Math.random() < 0.85 ? 'Acerto' : 'Erro';
        if (result === 'Acerto') successCount++;
        
        mockSignals.push({
            timestamp: date.toISOString(),
            pair: pair,
            timeframe: timeframe,
            signal: signal,
            price: price,
            probability: probability,
            result: result
        });
    }
    
    // Ordenar por data (mais recente primeiro)
    mockSignals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
        signals: mockSignals,
        successRate: ((successCount / totalCount) * 100).toFixed(1),
        totalSignals: totalCount,
        verifiedSignals: totalCount
    };
}

// Renderizar tabela de histórico
function renderHistoryTable(signals) {
    const tableBody = document.getElementById('historyTableBody');
    tableBody.innerHTML = '';
    
    signals.forEach(signal => {
        const date = new Date(signal.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        let signalBadgeClass = '';
        if (signal.signal === 'COMPRA') {
            signalBadgeClass = 'bg-success';
        } else if (signal.signal === 'VENDA') {
            signalBadgeClass = 'bg-danger';
        } else {
            signalBadgeClass = 'bg-secondary';
        }
        
        let resultBadgeClass = signal.result === 'Acerto' ? 'bg-success' : 'bg-danger';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${signal.pair}</td>
            <td>${getTimeframeName(signal.timeframe)}</td>
            <td><span class="badge ${signalBadgeClass}">${signal.signal}</span></td>
            <td>${signal.price}</td>
            <td>${signal.probability}%</td>
            <td><span class="badge ${resultBadgeClass}">${signal.result}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Filtrar dados de histórico
function filterHistoryData() {
    if (!window.historyData) return;
    
    const pairFilter = document.getElementById('historyPairSelect').value;
    const timeframeFilter = document.getElementById('historyTimeframeSelect').value;
    
    const filteredSignals = window.historyData.signals.filter(signal => {
        if (pairFilter !== 'all' && signal.pair !== pairFilter) {
            return false;
        }
        if (timeframeFilter !== 'all' && signal.timeframe !== timeframeFilter) {
            return false;
        }
        return true;
    });
    
    // Calcular nova taxa de sucesso para os sinais filtrados
    let successCount = 0;
    filteredSignals.forEach(signal => {
        if (signal.result === 'Acerto') successCount++;
    });
    
    const successRate = filteredSignals.length > 0 
        ? ((successCount / filteredSignals.length) * 100).toFixed(1) 
        : '0.0';
    
    // Atualizar estatísticas
    document.getElementById('successRate').textContent = `${successRate}%`;
    document.getElementById('totalSignals').textContent = filteredSignals.length;
    document.getElementById('verifiedSignals').textContent = filteredSignals.length;
    
    // Renderizar tabela filtrada
    renderHistoryTable(filteredSignals);
}

// Atualizar hora da última atualização
function updateLastUpdateTime(date) {
    const timeElement = document.getElementById('lastUpdateTime');
    if (date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;
    } else {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;
    }
}

// Obter nome do timeframe
function getTimeframeName(timeframeCode) {
    const timeframes = {
        'M1': '1 Minuto (M1)',
        'M5': '5 Minutos (M5)',
        'M15': '15 Minutos (M15)',
        'M30': '30 Minutos (M30)',
        'H1': '1 Hora (H1)',
        'H4': '4 Horas (H4)',
        'D1': 'Diário (D1)',
        'W1': 'Semanal (W1)'
    };
    
    return timeframes[timeframeCode] || timeframeCode;
}
