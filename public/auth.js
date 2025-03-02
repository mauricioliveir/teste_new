document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const cadastroFuncionarioForm = document.getElementById('cadastro-funcionario-form');
    const financeiroForm = document.getElementById('tesouraria-form');
    const vendasForm = document.getElementById('cadastro-venda-form');
    const estoqueForm = document.getElementById('cadastro-entrada-estoque-form');
    const errorMessage = document.getElementById('error-message');

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

    // Cadastro de entrada financeira
    if (financeiroForm) {
        financeiroForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const tipo = document.getElementById('tipo').value;
            const valor = parseFloat(document.getElementById('valor').value);
            const descricao = document.getElementById('descricao').value;

            try {
                const response = await fetch('/financeiro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tipo, valor, descricao }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    financeiroForm.reset();
                } else {
                    errorMessage.textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao cadastrar entrada financeira:', error);
                errorMessage.textContent = 'Erro ao conectar ao servidor.';
            }
        });
    }

    // Cadastro de venda
    if (vendasForm) {
        vendasForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const cliente = document.getElementById('cliente').value;
            const produto = document.getElementById('produto').value;
            const valor = parseFloat(document.getElementById('valor').value);

            try {
                const response = await fetch('/vendas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cliente, produto, valor }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    vendasForm.reset();
                } else {
                    errorMessage.textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao cadastrar venda:', error);
                errorMessage.textContent = 'Erro ao conectar ao servidor.';
            }
        });
    }

    // Cadastro de entrada no estoque
    if (estoqueForm) {
        estoqueForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const produto = document.getElementById('produto').value;
            const quantidade = parseInt(document.getElementById('quantidade').value);
            const valorUnitario = parseFloat(document.getElementById('valor-unitario').value);
            const notaFiscal = document.getElementById('nota-fiscal').value;

            try {
                const response = await fetch('/estoque', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ produto, quantidade, valorUnitario, notaFiscal }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    estoqueForm.reset();
                } else {
                    errorMessage.textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao cadastrar entrada no estoque:', error);
                errorMessage.textContent = 'Erro ao conectar ao servidor.';
            }
        });
    }
});