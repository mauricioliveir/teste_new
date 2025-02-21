// Verifica se o usuário está logado usando sessionStorage
const isLoggedIn = sessionStorage.getItem('isLoggedIn');
if (!isLoggedIn || isLoggedIn !== 'true') {
    // Redireciona para a página de login se não estiver logado
    window.location.href = "login.html";
}

// Recupera o nome do usuário do sessionStorage
const username = sessionStorage.getItem('username');
if (username) {
    document.getElementById('username').textContent = username;
}

// Adiciona funcionalidade ao botão de logout
document.getElementById('logout-button-header').addEventListener('click', function() {
    // Remove o estado de login e o nome do usuário
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    // Redireciona para a página de login
    window.location.href = "login.html";
});