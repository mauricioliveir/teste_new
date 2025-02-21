document.addEventListener('DOMContentLoaded', function() {
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    localStorage.setItem('isLoggedIn', 'true');
                    window.location.href = 'dashboard.html';
                } else {
                    document.getElementById('error-message').textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }

    // Registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nome, email, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    window.location.href = 'login.html';
                } else {
                    document.getElementById('error-message').textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao registrar:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }

    // Redefinição de senha
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;

            try {
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                } else {
                    document.getElementById('error-message').textContent = result.message;
                }
            } catch (error) {
                console.error('Erro ao redefinir senha:', error);
                alert('Erro ao conectar ao servidor.');
            }
        });
    }
});