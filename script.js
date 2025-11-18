document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialização e Referências
    const canvas = document.getElementById('waveCanvas');
    if (!canvas) {
        console.error("Elemento 'waveCanvas' não encontrado.");
        return;
    }
    const ctx = canvas.getContext('2d');
    
    // Referências aos elementos de controle
    const customFuncInput = document.getElementById('custom-func');
    const controls = document.querySelectorAll('.controls input[type="range"], .controls select, .controls input[type="text"]');
    const resetButton = document.getElementById('resetButton');

    // Configurações do Canvas e Escala
    const width = canvas.width;
    const height = canvas.height;
    const scaleY = 50; // 1 unidade real = 50 pixels
    const scaleX = 100; // 1 unidade real = 100 pixels
    const originX = width / 2;
    const originY = height / 2; // Posição vertical central do canvas

    // Valores Padrão
    const DEFAULT_SLIDERS = { A: 1.0, B: 1.0, C: 0.0, D: 0.0, funcType: 'sin' };

    // Funções e constantes permitidas na expressão customizada
    const SAFE_REPLACEMENTS = {
        'sin': 'Math.sin', 'cos': 'Math.cos', 'tan': 'Math.tan',
        'PI': 'Math.PI', 'E': 'Math.E', 'pow': 'Math.pow', 'sqrt': 'Math.sqrt', 
        'abs': 'Math.abs', 'round': 'Math.round', 'floor': 'Math.floor', 'ceil': 'Math.ceil'
    };

    // Função Segura de Avaliação
    function evaluateSafe(expression, x) {
        let code = expression;
        
        // Substitui termos matemáticos por suas versões Math.
        Object.keys(SAFE_REPLACEMENTS).forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'g');
            code = code.replace(regex, SAFE_REPLACEMENTS[term]);
        });
        
        // Garante que as variáveis do usuário 'x' ou 'X' sejam a variável injetada
        code = code.replace(/[xX]/g, 'x');

        try {
            return new Function('x', 'return ' + code)(x);
        } catch (e) {
            console.error("Erro na avaliação da função. Expresão:", expression, e);
            return NaN; 
        }
    }

    // Função para obter os parâmetros
    function getParams() {
        const expression = customFuncInput.value.trim();
        const usingCustom = expression.length > 0;

        let A, B, C, D, funcType;

        // Leitura dos sliders (A, B, C, D) e dropdown (funcType)
        A = parseFloat(document.getElementById('amplitude').value);
        B = parseFloat(document.getElementById('frequency').value);
        C = parseFloat(document.getElementById('phase').value);
        D = parseFloat(document.getElementById('vertical').value);
        funcType = document.getElementById('function-type').value;
        
        // Atualiza os spans para refletir qual modo está ativo
        if (usingCustom) {
            document.getElementById('amp-value').textContent = '—';
            document.getElementById('freq-value').textContent = '—';
            document.getElementById('phase-value').textContent = '—';
        } else {
            document.getElementById('amp-value').textContent = A.toFixed(1);
            document.getElementById('freq-value').textContent = B.toFixed(1);
            document.getElementById('phase-value').textContent = C.toFixed(2);
        }
        document.getElementById('vertical-value').textContent = D.toFixed(1); // D é sempre exibido

        return { A, B, C, D, funcType, expression, usingCustom };
    }

    // Função para resetar
    function resetControls() {
        document.getElementById('amplitude').value = DEFAULT_SLIDERS.A;
        document.getElementById('frequency').value = DEFAULT_SLIDERS.B;
        document.getElementById('phase').value = DEFAULT_SLIDERS.C;
        document.getElementById('vertical').value = DEFAULT_SLIDERS.D;
        document.getElementById('function-type').value = DEFAULT_SLIDERS.funcType;
        customFuncInput.value = '';

        drawWave();
    }

    // Função principal de desenho
    function drawWave() {
        const { A, B, C, D, funcType, expression, usingCustom } = getParams();
        
        ctx.clearRect(0, 0, width, height);

        // --- 2. Desenho dos Eixos X e Y ---
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;

        // Eixo X (Horizontal) - FIXO no centro (originY)
        ctx.beginPath();
        ctx.moveTo(0, originY); 
        ctx.lineTo(width, originY);
        ctx.stroke();

        // Eixo Y (Vertical)
        ctx.beginPath();
        ctx.moveTo(originX, 0); 
        ctx.lineTo(originX, height);
        ctx.stroke();

        // --- 3. Desenho de Marcas (Ticks) e Valores nos Eixos ---
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.lineWidth = 1;

        // Marcas no Eixo Y (vertical)
        for (let y = -4; y <= 4; y += 1) { 
            const yCanvas = originY - y * scaleY;
            
            if (yCanvas >= 0 && yCanvas <= height) {
                ctx.strokeStyle = '#999';
                ctx.beginPath();
                ctx.moveTo(originX - 5, yCanvas); 
                ctx.lineTo(originX + 5, yCanvas); 
                ctx.stroke();

                if (y !== 0) {
                    ctx.fillText(y.toString(), originX + 10, yCanvas + 4);
                }
            }
        }

        // Marcas no Eixo X (horizontal)
        for (let x = -4; x <= 4; x += 1) { 
            const xCanvas = originX + x * scaleX; 
            
            if (xCanvas >= 0 && xCanvas <= width) {
                ctx.strokeStyle = '#999';
                ctx.beginPath();
                // Usa originY (o eixo fixo)
                ctx.moveTo(xCanvas, originY - 5); 
                ctx.lineTo(xCanvas, originY + 5); 
                ctx.stroke();

                if (x !== 0) {
                    // Texto na altura do eixo fixo
                    ctx.fillText(x.toString(), xCanvas - 5, originY - 10); 
                }
            }
        }
        // --------------------------------------------------------

        // 4. Desenha a Onda
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        let lastPointValid = false;

        for (let i = 0; i <= width; i++) {
            const x_Real = (i - originX) / scaleX; 
            let Y_Real;

            if (usingCustom) {
                // MODO 1: FUNÇÃO CUSTOMIZADA
                Y_Real = evaluateSafe(expression, x_Real);
            } else {
                // MODO 2: SLIDERS
                const valueInsideFunc = B * (x_Real - C);
                let funcResult;

                if (funcType === 'sin') {
                    funcResult = Math.sin(valueInsideFunc);
                } else { // 'cos'
                    funcResult = Math.cos(valueInsideFunc);
                }
                
                // Aplica D APENAS aqui, deslocando a FUNÇÃO, e não o eixo.
                Y_Real = A * funcResult + D; 
            }
            
            // Pular pontos inválidos (NaN)
            if (isNaN(Y_Real)) {
                lastPointValid = false;
                continue; 
            }
            
            const yCanvas = originY - Y_Real * scaleY; // originY é o centro fixo

            if (!lastPointValid) {
                ctx.moveTo(i, yCanvas);
            } else {
                ctx.lineTo(i, yCanvas);
            }
            lastPointValid = true;
        }
        ctx.stroke();
    }

    // 5. Adiciona event listeners
    controls.forEach(control => {
        control.addEventListener('input', drawWave);
    });

    // Listener para o botão de reset
    resetButton.addEventListener('click', resetControls);

    // 6. Desenha a onda inicial ao carregar
    drawWave();
});
