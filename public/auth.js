document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const cadastroFuncionarioForm = document.getElementById('cadastro-funcionario-form');
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

    if (cadastroFuncionarioForm) {
        cadastroFuncionarioForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const nome = document.getElementById('nome').value;
            const cpf = document.getElementById('cpf').value;
            const rg = document.getElementById('rg').value;
            const filiacao = document.getElementById('filiacao').value;
            const cepInput = document.getElementById("cep");
            const logradouroInput = document.getElementById("logradouro");
            const numeroInput = document.getElementById("numero");
            const cidadeInput = document.getElementById("cidade");
            const estadoInput = document.getElementById("estado");
            const telefone = document.getElementById('telefone').value;
            const email = document.getElementById('email').value;
            const cargo_admitido = document.getElementById('cargo_admitido').value;
            const salario = document.getElementById('salario').value;

            try {
                const response = await fetch('/funcionarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, cpf, rg, filiacao, cep, logradouro, numero, 
                        bairro, cidade, estado, telefone, email, cargo_admitido, salario }),
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
});
