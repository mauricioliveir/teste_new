document.addEventListener("DOMContentLoaded", function () {
    // Verifica se o usuário está logado
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = "home.html";
    }

    // Adiciona evento de logout
    document.getElementById('logout-button').addEventListener('click', function() {
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = "index.html";
    });

    // Manipulação dos links de navegação
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section");
    
    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            
            // Remove a classe 'active' de todos os links e seções
            navLinks.forEach(nav => nav.classList.remove("active"));
            sections.forEach(sec => sec.classList.remove("active"));
            
            // Adiciona a classe 'active' apenas ao link e à seção correspondente
            this.classList.add("active");
            const targetSection = document.querySelector(this.getAttribute("href"));
            if (targetSection) {
                targetSection.classList.add("active");
            }
        });
    });
});
