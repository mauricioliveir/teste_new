// Verifica se o usuário está logado usando sessionStorage
const isLoggedIn = sessionStorage.getItem('isLoggedIn');
if (!isLoggedIn || isLoggedIn !== 'true') {
    // Redireciona para a página de login se não estiver logado
    window.location.href = "login.html";
}

// Adiciona funcionalidade ao botão de logout
document.getElementById('logout-button').addEventListener('click', function() {
    // Remove o estado de login
    sessionStorage.removeItem('isLoggedIn');
    // Redireciona para a página de login
    window.location.href = "login.html";
});