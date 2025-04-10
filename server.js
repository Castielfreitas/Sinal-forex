const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Inicializar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

// Armazenamento em memória para sinais (em produção seria um banco de dados)
let forexSignals = {};
let signalHistory = [];
let lastUpdate = new Date();

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API para obter sinais Forex
app.get('/api/forex/signals', (req, res) => {
    // Verificar se os sinais estão atualizados (menos de 5 minutos)
    const now = new Date();
    const diffMinutes = Math.floor((now - lastUpdate) / (1000 * 60));
    
    if (diffMinutes >= 5 || Object.keys(forexSignals).length === 0) {
        // Atualizar sinais
        updateForexSignals()
            .then(() => {
                res.json({
                    timestamp: new Date().toISOString(),
                    signals: Object.values(forexSignals)
                });
            })
            .catch(error => {
                console.error('Erro ao atualizar sinais:', error);
                res.status(500).json({
                    error: 'Erro ao atualizar sinais',
                    message: error.message
                });
            });
    } else {
        // Retornar sinais em cache
        res.json({
            timestamp: lastUpdate.toISOString(),
            signals: Object.values(forexSignals)
        });
    }
});

// API para obter histórico de sinais
app.get('/api/forex/history', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        signals: signalHistory
    });
});

// API para obter dados de um par específico
app.get('/api/forex/pair/:pair', (req, res) => {
    const pair = req.params.pair;
    
    if (forexSignals[pair]) {
        res.json(forexSignals[pair]);
    } else {
        res.status(404).json({
            error: 'Par não encontrado',
            message: `Não foram encontrados dados para o par ${pair}`
        });
    }
});

// Função para atualizar sinais Forex
async function updateForexSignals() {
    try {
        // Em um ambiente real, aqui chamaríamos o modelo Python
        // Para demonstração, vamos gerar dados simulados
        
        // Executar script Python para gerar sinais
        const pythonProcess = spawn('python3', ['data/generate_signals.py']);
        
        return new Promise((resolve, reject) => {
            let signalsData = '';
            
            pythonProcess.stdout.on('data', (data) => {
                signalsData += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                console.error(`Erro no script Python: ${data}`);
            });
            
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.warn(`Script Python encerrou com código ${code}`);
                    // Fallback para dados simulados em caso de erro
                    generateMockSignals();
                    resolve();
                } else {
                    try {
                        const signals = JSON.parse(signalsData);
                        updateSignalsData(signals);
                        resolve();
                    } catch (error) {
                        console.error('Erro ao processar dados do Python:', error);
                        // Fallback para dados simulados em caso de erro
                        generateMockSignals();
                        resolve();
                    }
                }
            });
        });
    } catch (error) {
        console.error('Erro ao atualizar sinais:', error);
        // Fallback para dados simulados em caso de erro
        generateMockSignals();
    }
}

// Função para gerar sinais simulados (fallback)
function generateMockSignals() {
    const pairs = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/BRL'];
    const signals = ['COMPRA', 'VENDA', 'NEUTRO'];
    const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
    
    const mockSignals = [];
    
    pairs.forEach(pair => {
        const signal = signals[Math.floor(Math.random() * signals.length)];
        const probability = (50 + Math.random() * 40).toFixed(1);
        const price = (1 + Math.random() * 4).toFixed(4);
        
        // Criar data/hora atual
        const date = new Date();
        
        const signalData = {
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
        };
        
        mockSignals.push(signalData);
        forexSignals[pair] = signalData;
    });
    
    // Atualizar timestamp
    lastUpdate = new Date();
    
    // Adicionar ao histórico
    updateSignalHistory(mockSignals);
    
    return mockSignals;
}

// Função para atualizar dados de sinais
function updateSignalsData(signals) {
    signals.forEach(signal => {
        forexSignals[signal.pair] = signal;
    });
    
    // Atualizar timestamp
    lastUpdate = new Date();
    
    // Adicionar ao histórico
    updateSignalHistory(signals);
    
    return signals;
}

// Função para atualizar histórico de sinais
function updateSignalHistory(signals) {
    // Em um ambiente real, isso seria armazenado em um banco de dados
    // Para demonstração, vamos manter um histórico em memória
    
    signals.forEach(signal => {
        // Verificar se o sinal já existe no histórico
        const existingIndex = signalHistory.findIndex(
            s => s.pair === signal.pair && 
                 s.timeframe === signal.timeframe && 
                 new Date(s.timestamp).toDateString() === new Date(signal.timestamp).toDateString()
        );
        
        if (existingIndex === -1) {
            // Adicionar resultado aleatório para demonstração
            const result = Math.random() < 0.85 ? 'Acerto' : 'Erro';
            
            signalHistory.push({
                ...signal,
                result: result
            });
        }
    });
    
    // Limitar tamanho do histórico (manter últimos 100 sinais)
    if (signalHistory.length > 100) {
        signalHistory = signalHistory.slice(signalHistory.length - 100);
    }
    
    // Ordenar por data (mais recente primeiro)
    signalHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
    
    // Gerar sinais iniciais
    generateMockSignals();
});
