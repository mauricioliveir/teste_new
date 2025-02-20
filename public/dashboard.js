document.addEventListener('DOMContentLoaded', function() {
    const userList = document.getElementById('user-list');
    const logoutButton = document.getElementById('logout-button');

    // Carregar usuários
    async function loadUsers() {
        try {
            const response = await fetch('/users');
            const result = await response.json();

            if (response.ok) {
                userList.innerHTML = result.users.map(user => `
                    <li>${user.nome} - ${user.email}</li>
                `).join('');
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao conectar ao servidor.');
        }
    }

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('isLoggedIn');
            window.location.href = '/';
        });
    }

    loadUsers();
});