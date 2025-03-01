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

document.addEventListener("DOMContentLoaded", function () {
    const cepInput = document.getElementById("cep");
    const logradouroInput = document.getElementById("logradouro");
    const bairroInput = document.getElementById("bairro");
    const cidadeInput = document.getElementById("cidade");
    const estadoInput = document.getElementById("estado");

    const tiposLogradouro = ["Rua", "Avenida", "Praça", "Travessa", "Alameda", "Rodovia", "Estrada", "Vila"];

    // Formatação dinâmica do CEP
    cepInput.addEventListener("input", function () {
        let cep = this.value.replace(/\D/g, ""); // Remove caracteres não numéricos
        if (cep.length > 8) cep = cep.slice(0, 8); // Garante no máximo 8 dígitos

        if (cep.length >= 5) {
            this.value = `${cep.slice(0, 5)}-${cep.slice(5)}`;
        } else {
            this.value = cep;
        }
    });

    cepInput.addEventListener("blur", function () {
        let cep = this.value.replace(/\D/g, "");

        logradouroInput.disabled = false;
        cidadeInput.disabled = false;
        estadoInput.disabled = false;

        if (cep.length !== 8) {
            alert("CEP inválido! Digite um CEP com 8 dígitos.");
            return;
        }

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    alert("CEP não encontrado. Preencha os dados manualmente.");
                    return;
                }

                let logradouro = data.logradouro || "";
                let partesLogradouro = logradouro.split(" ");
                let tipoLogradouro = "Rua";

                if (partesLogradouro.length > 1 && tiposLogradouro.includes(partesLogradouro[0])) {
                    tipoLogradouro = partesLogradouro.shift();
                    logradouro = partesLogradouro.join(" ");
                }

                logradouroInput.value = `${tipoLogradouro} ${logradouro}`;
                bairroInput.value = data.bairro;
                cidadeInput.value = data.localidade;
                estadoInput.value = data.uf;

                logradouroInput.disabled = true;
                bairroInput.disabled = true;
                cidadeInput.disabled = true;
                estadoInput.disabled = true;
            })
            .catch(error => console.error("Erro ao buscar CEP:", error));
    });
});

// Função para validar e formatar CPF
const cpfInput = document.getElementById("cpf");
const errorMessage = document.getElementById("error-message"); // Elemento para exibir mensagens de erro

cpfInput.addEventListener("input", () => {
    let cpf = cpfInput.value.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (cpf.length > 11) cpf = cpf.slice(0, 11); // Limita a 11 dígitos

    // Formata o CPF
    if (cpf.length >= 3) cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
    if (cpf.length >= 6) cpf = cpf.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if (cpf.length >= 9) cpf = cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

    cpfInput.value = cpf; // Atualiza o valor do campo com o CPF formatado
});

// Função para validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, ""); // Remove caracteres não numéricos

    // Verifica se o CPF tem 11 dígitos e não é uma sequência repetida
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    // Calcula o primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    // Calcula o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true; // CPF válido
}

// Adiciona evento para validar o CPF apenas quando o campo tiver 11 caracteres
cpfInput.addEventListener("blur", () => {
    let cpf = cpfInput.value.replace(/\D/g, ""); // Remove caracteres não numéricos

    // Verifica se o CPF tem 11 caracteres antes de validar
    if (cpf.length === 11) {
        if (!validarCPF(cpf)) {
            errorMessage.textContent = "CPF inválido! Por favor, insira um CPF válido."; // Exibe a mensagem de erro
            errorMessage.style.color = "red"; // Estiliza a mensagem de erro
        } else {
            errorMessage.textContent = ""; // Limpa a mensagem de erro se o CPF for válido
        }
    } else {
        errorMessage.textContent = ""; // Limpa a mensagem de erro se o CPF tiver menos de 11 caracteres
    }
});

// Seleciona o botão e os campos do formulário
const form = document.getElementById('cadastro-funcionario-form');
const submitBtn = document.getElementById('submit-btn');
const requiredFields = form.querySelectorAll('[required]');

// Função para verificar se todos os campos obrigatórios estão preenchidos
function checkFormCompletion() {
    let allFilled = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            allFilled = false;
        }
    });

    // Habilita ou desabilita o botão de submit
    submitBtn.disabled = !allFilled;
}

// Adiciona event listeners para verificar o preenchimento do formulário
requiredFields.forEach(field => {
    field.addEventListener('input', checkFormCompletion);
});

// Verifica o preenchimento do formulário ao carregar
checkFormCompletion();
