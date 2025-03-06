document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const cadastroFuncionarioForm = document.getElementById('cadastro-funcionario-form');
    const tesourariaForm = document.getElementById('tesouraria-form');
    const formContaPagar = document.getElementById('form-conta-pagar');
    const formContaReceber = document.getElementById('form-conta-receber');
    const gerarRelatorioFinanceiroBtn = document.getElementById('gerar-relatorio-financeiro');
    const gerarPdfContasAPagarBtn = document.getElementById('gerar-pdf-contas-a-pagar');
    const gerarPdfContasAReceberBtn = document.getElementById('gerar-pdf-contas-a-receber');
    const listaContasPagar = document.getElementById('lista-contas-pagar');
    const listaContasReceber = document.getElementById('lista-contas-receber');
    const errorMessage = document.getElementById('error-message');

    // Função para atualizar o saldo do fluxo de caixa
    async function atualizarSaldo() {
        try {
            const response = await fetch('/fluxo-caixa');
            const data = await response.json();

            if (response.ok) {
                const saldoAnterior = document.getElementById('saldo-anterior');
                const entradas = document.getElementById('entradas');
                const saidas = document.getElementById('saidas');
                const saldoFinal = document.getElementById('saldo-final');

                const totalEntradas = data.fluxo.filter(item => item.tipo === 'entrada').reduce((acc, item) => acc + item.valor, 0);
                const totalSaidas = data.fluxo.filter(item => item.tipo === 'saida').reduce((acc, item) => acc + item.valor, 0);

                saldoAnterior.textContent = '0.00'; // Implementar lógica para saldo anterior se necessário
                entradas.textContent = totalEntradas.toFixed(2);
                saidas.textContent = totalSaidas.toFixed(2);
                saldoFinal.textContent = (totalEntradas - totalSaidas).toFixed(2);
            } else {
                console.error('Erro ao buscar fluxo de caixa:', data.message);
            }
        } catch (error) {
            console.error('Erro ao atualizar saldo:', error);
        }
    }

    // Registro de usuário
    if (registerForm) {
        registerForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    window.location.href = '/login.html';
                } else {
                    errorMessage.textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao registrar:', error);
                errorMessage.textContent = 'Erro ao conectar ao servidor.';
            }
        });
    }

    // Login de usuário
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('isLoggedIn', 'true'); // Mantém o usuário logado
                    alert(result.message);
                    window.location.href = '/home.html';
                } else {
                    errorMessage.textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                errorMessage.textContent = 'Erro ao conectar ao servidor.';
            }
        });
    }

    // Reset de senha
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const email = document.getElementById('email').value;

            try {
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    window.location.href = '/login.html';
                } else {
                    errorMessage.textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao solicitar redefinição de senha:', error);
                errorMessage.textContent = 'Erro ao conectar ao servidor.';
            }
        });
    }

    // Cadastro de funcionário
    if (cadastroFuncionarioForm) {
        cadastroFuncionarioForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const nome = document.getElementById('nome').value;
            const cpf = document.getElementById('cpf').value;
            const rg = document.getElementById('rg').value;
            const filiacao = document.getElementById('filiacao').value;
            const cep = document.getElementById('cep').value;
            const logradouro = document.getElementById('logradouro').value;
            const numero = document.getElementById('numero').value;
            const bairro = document.getElementById('bairro').value;
            const cidade = document.getElementById('cidade').value;
            const estado = document.getElementById('estado').value;
            const telefone = document.getElementById('telefone').value;
            const email = document.getElementById('email').value;
            const cargo_admitido = document.getElementById('cargo_admitido').value;
            const salario = document.getElementById('salario').value;

            try {
                const response = await fetch('/funcionarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome, cpf, rg, filiacao, cep, logradouro, numero, bairro,
                        cidade, estado, telefone, email, cargo_admitido, salario
                    }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    cadastroFuncionarioForm.reset();
                } else {
                    errorMessage.textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao cadastrar funcionário:', error);
                errorMessage.textContent = 'Erro ao conectar ao servidor.';
            }
        });
    }

    // Lançamento de tesouraria
    if (tesourariaForm) {
        tesourariaForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const tipo = document.getElementById('tipo').value;
            const valor = parseFloat(document.getElementById('valor').value);
            const descricao = document.getElementById('descricao').value;

            try {
                const response = await fetch('/fluxo-caixa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tipo, valor, descricao }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    tesourariaForm.reset();
                    atualizarSaldo();
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Erro ao lançar tesouraria:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }

    // Cadastro de contas a pagar
    if (formContaPagar) {
        formContaPagar.addEventListener('submit', async function (event) {
            event.preventDefault();

            const descricao = document.getElementById('descricao-pagar').value;
            const valor = parseFloat(document.getElementById('valor-pagar').value);
            const vencimento = document.getElementById('vencimento-pagar').value;

            try {
                const response = await fetch('/contas-a-pagar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descricao, valor, vencimento }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    formContaPagar.reset();
                    carregarContasPagar();
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Erro ao cadastrar conta a pagar:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }

    // Cadastro de contas a receber
    if (formContaReceber) {
        formContaReceber.addEventListener('submit', async function (event) {
            event.preventDefault();

            const descricao = document.getElementById('descricao-receber').value;
            const valor = parseFloat(document.getElementById('valor-receber').value);
            const vencimento = document.getElementById('vencimento-receber').value;

            try {
                const response = await fetch('/contas-a-receber', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descricao, valor, vencimento }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    formContaReceber.reset();
                    carregarContasReceber();
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Erro ao cadastrar conta a receber:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }

    // Carregar contas a pagar
    async function carregarContasPagar() {
        try {
            const response = await fetch('/contas-a-pagar');
            const data = await response.json();

            if (response.ok) {
                listaContasPagar.innerHTML = '';
                data.contas.forEach(conta => {
                    const li = document.createElement('li');
                    li.textContent = `${conta.descricao} - R$ ${conta.valor.toFixed(2)} - Vencimento: ${conta.vencimento}`;
                    listaContasPagar.appendChild(li);
                });
            } else {
                console.error('Erro ao carregar contas a pagar:', data.message);
            }
        } catch (error) {
            console.error('Erro ao carregar contas a pagar:', error);
        }
    }

    // Carregar contas a receber
    async function carregarContasReceber() {
        try {
            const response = await fetch('/contas-a-receber');
            const data = await response.json();

            if (response.ok) {
                listaContasReceber.innerHTML = '';
                data.contas.forEach(conta => {
                    const li = document.createElement('li');
                    li.textContent = `${conta.descricao} - R$ ${conta.valor.toFixed(2)} - Vencimento: ${conta.vencimento}`;
                    listaContasReceber.appendChild(li);
                });
            } else {
                console.error('Erro ao carregar contas a receber:', data.message);
            }
        } catch (error) {
            console.error('Erro ao carregar contas a receber:', error);
        }
    }

    // Gerar relatório financeiro (PDF)
    if (gerarRelatorioFinanceiroBtn) {
        gerarRelatorioFinanceiroBtn.addEventListener('click', async function () {
            try {
                const response = await fetch('/gerar-pdf-fluxo-caixa');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'fluxo_caixa.pdf';
                    a.click();
                } else {
                    alert('Erro ao gerar relatório financeiro.');
                }
            } catch (error) {
                console.error('Erro ao gerar relatório financeiro:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }

    // Gerar PDF de contas a pagar
    if (gerarPdfContasAPagarBtn) {
        gerarPdfContasAPagarBtn.addEventListener('click', async function () {
            try {
                const response = await fetch('/gerar-pdf-contas-a-pagar');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'contas_a_pagar.pdf';
                    a.click();
                } else {
                    alert('Erro ao gerar PDF de contas a pagar.');
                }
            } catch (error) {
                console.error('Erro ao gerar PDF de contas a pagar:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }

    // Gerar PDF de contas a receber
    if (gerarPdfContasAReceberBtn) {
        gerarPdfContasAReceberBtn.addEventListener('click', async function () {
            try {
                const response = await fetch('/gerar-pdf-contas-a-receber');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'contas_a_receber.pdf';
                    a.click();
                } else {
                    alert('Erro ao gerar PDF de contas a receber.');
                }
            } catch (error) {
                console.error('Erro ao gerar PDF de contas a receber:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }

    // Inicialização
    atualizarSaldo();
    carregarContasPagar();
    carregarContasReceber();
});