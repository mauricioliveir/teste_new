document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
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
                    localStorage.setItem('isLoggedIn', 'true'); // Mantém o usuário logado
                    alert(result.message);
                    window.location.href = '/index.html';
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
});

document.addEventListener('DOMContentLoaded', function () {
    const userNameDisplay = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');

    // Verifica se o usuário está logado
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userName = localStorage.getItem('userName'); // Obtém o nome armazenado

    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = "login.html";
    } else if (userName) {
        userNameDisplay.textContent = `Olá, ${userName}`;
    }

    // Logout
    logoutButton.addEventListener('click', function () {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        window.location.href = "login.html";
    });
});

// Captura o nome do usuário no login
async function loginUser(email, password) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', result.nome); // Armazena o nome do usuário
            window.location.href = 'index.html';
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao conectar ao servidor:', error);
    }
}