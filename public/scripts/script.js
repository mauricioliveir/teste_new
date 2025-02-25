const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn || isLoggedIn !== 'true') {
            window.location.href = "home.html";
        }

        document.getElementById('logout-button').addEventListener('click', function() {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = "index.html";
        });

        document.addEventListener("DOMContentLoaded", function () {
            const navLinks = document.querySelectorAll(".nav-link");
            const sections = document.querySelectorAll("main section");

            function showSection(id) {
                sections.forEach(section => {
                    section.classList.remove("active");
                    if (section.id === id) {
                        section.classList.add("active");
                    }
                });
            }

            navLinks.forEach(link => {
                link.addEventListener("click", function (event) {
                    event.preventDefault();
                    navLinks.forEach(item => item.classList.remove("active"));
                    this.classList.add("active");
                    const sectionId = this.getAttribute("href").substring(1);
                    showSection(sectionId);
                });
            });

            showSection("home");
        });