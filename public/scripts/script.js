document.addEventListener("DOMContentLoaded", function () {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');

    if (isLoggedIn !== 'true') {
        window.location.href = '/index.html';
    } else {
        initNavigation();
        initCEPValidation();
        initCPFValidation();
        initFormCompletionCheck();
        initEstoque();
        atualizarFluxoCaixa();

        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', function () {
                sessionStorage.removeItem('isLoggedIn');
                window.location.href = '/index.html';
            });
        }
    }
});

// 1. Navegação entre seções
function initNavigation() {
    const navLinks = document.querySelectorAll("nav ul li a");
    const sections = document.querySelectorAll("section");

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            const targetSection = document.querySelector(this.getAttribute("href"));
            if (!targetSection) {
                console.error(`Seção não encontrada para ${this.getAttribute("href")}`);
                return;
            }

            // Remove a classe 'active' de todos os links e seções
            navLinks.forEach(nav => nav.classList.remove("active"));
            sections.forEach(sec => sec.classList.remove("active"));

            // Adiciona a classe 'active' ao link e à seção correspondente
            this.classList.add("active");
            targetSection.classList.add("active");
        });
    });

    // Exibir a primeira seção por padrão ao carregar a página
    if (sections.length > 0) {
        sections[0].classList.add("active");
        navLinks[0].classList.add("active");
    }
}

// 2. Validação e preenchimento automático de CEP
function initCEPValidation() {
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

    // Busca o endereço ao perder o foco do campo CEP
    cepInput.addEventListener("blur", function () {
        let cep = this.value.replace(/\D/g, "");

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

                // Desabilita os campos após o preenchimento automático
                logradouroInput.disabled = true;
                bairroInput.disabled = true;
                cidadeInput.disabled = true;
                estadoInput.disabled = true;
            })
            .catch(error => console.error("Erro ao buscar CEP:", error));
    });
}

// 3. Validação e formatação de CPF
function initCPFValidation() {
    const cpfInput = document.getElementById("cpf");
    const errorMessage = document.getElementById("error-message");

    // Formatação do CPF
    cpfInput.addEventListener("input", () => {
        let cpf = cpfInput.value.replace(/\D/g, ""); // Remove caracteres não numéricos
        if (cpf.length > 11) cpf = cpf.slice(0, 11); // Limita a 11 dígitos

        // Formata o CPF
        if (cpf.length >= 3) cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
        if (cpf.length >= 6) cpf = cpf.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
        if (cpf.length >= 9) cpf = cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

        cpfInput.value = cpf; // Atualiza o valor do campo com o CPF formatado
    });

    // Validação do CPF
    cpfInput.addEventListener("blur", () => {
        let cpf = cpfInput.value.replace(/\D/g, "");

        if (cpf.length === 11) {
            if (!validarCPF(cpf)) {
                errorMessage.textContent = "CPF inválido! Por favor, insira um CPF válido.";
                errorMessage.style.color = "red";
            } else {
                errorMessage.textContent = "";
            }
        } else {
            errorMessage.textContent = "CPF sem os 11 digitos! Por favor, insira um CPF válido.";
            errorMessage.style.color = "red";
        }
    });
}

// Função para validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    return resto === parseInt(cpf.charAt(10));
}

// 4. Verificação de preenchimento do formulário
function initFormCompletionCheck() {
    const form = document.getElementById('cadastro-funcionario-form');
    const submitBtn = document.getElementById('submit-btn');
    const requiredFields = form.querySelectorAll('[required]');

    function checkFormCompletion() {
        let allFilled = true;
        requiredFields.forEach(field => {
            if (!field.value.trim()) allFilled = false;
        });
        submitBtn.disabled = !allFilled;
    }

    requiredFields.forEach(field => {
        field.addEventListener('input', checkFormCompletion);
    });

    checkFormCompletion();
}

// Função para enviar dados de tesouraria
document.getElementById('tesouraria-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipo = document.getElementById('tipo').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const descricao = document.getElementById('descricao').value;

    try {
        const response = await fetch('/tesouraria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, valor, descricao })
        });
        const data = await response.json();
        if (data.success) {
            alert('Lançamento realizado com sucesso!');
            atualizarFluxoCaixa();
        } else {
            alert('Erro ao realizar lançamento.');
        }
    } catch (err) {
        console.error('Erro ao enviar dados:', err);
    }
});

// Função para atualizar o fluxo de caixa
async function atualizarFluxoCaixa() {
    try {
        const response = await fetch('/tesouraria');
        const data = await response.json();
        const lancamentos = data.lancamentos;

        let entradas = 0;
        let saidas = 0;

        lancamentos.forEach(lancamento => {
            if (lancamento.tipo === 'entrada') {
                entradas += parseFloat(lancamento.valor);
            } else {
                saidas += parseFloat(lancamento.valor);
            }
        });

        const saldoFinal = entradas - saidas;

        document.getElementById('entradas').textContent = entradas.toFixed(2);
        document.getElementById('saidas').textContent = saidas.toFixed(2);
        document.getElementById('saldo-final').textContent = saldoFinal.toFixed(2);
    } catch (err) {
        console.error('Erro ao atualizar fluxo de caixa:', err);
    }
}

// Função para gerar relatório financeiro em PDF
document.getElementById('gerar-relatorio-financeiro').addEventListener('click', () => {
    window.location.href = '/relatorio-financeiro';
});

// Inicializa o fluxo de caixa ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    atualizarFluxoCaixa();
});

// Função para registrar uma venda
document.getElementById('cadastro-venda-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cliente = document.getElementById('cliente-venda').value;
    const produto = document.getElementById('produto-venda').value;
    const valor = parseFloat(document.getElementById('valor-venda').value);

    try {
        const response = await fetch('/vendas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente, produto, valor })
        });
        const data = await response.json();
        if (data.success) {
            alert('Venda registrada com sucesso!');
            exibirNotaFiscal(data.venda);
        } else {
            alert('Erro ao registrar venda.');
        }
    } catch (err) {
        console.error('Erro ao enviar dados:', err);
    }
});

// Função para exibir a nota fiscal
function exibirNotaFiscal(venda) {
    const notaFiscalDiv = document.getElementById('nota-fiscal');
    notaFiscalDiv.innerHTML = `
        <h3>Nota Fiscal</h3>
        <p><strong>Cliente:</strong> ${venda.cliente}</p>
        <p><strong>Produto:</strong> ${venda.produto}</p>
        <p><strong>Valor:</strong> R$ ${venda.valor.toFixed(2)}</p>
        <p><strong>Data:</strong> ${new Date(venda.data).toLocaleString()}</p>
    `;
}

// Função para gerar relatório de vendas em PDF
document.getElementById('gerar-relatorio-vendas').addEventListener('click', () => {
    window.location.href = '/relatorio-vendas';
});

// Função para carregar as vendas ao abrir a página
async function carregarVendas() {
    try {
        const response = await fetch('/vendas');
        const data = await response.json();
        if (data.success && data.vendas.length > 0) {
            exibirNotaFiscal(data.vendas[0]); // Exibe a última venda registrada
        }
    } catch (err) {
        console.error('Erro ao carregar vendas:', err);
    }
}
