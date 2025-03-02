document.addEventListener("DOMContentLoaded", function () {
    // Verifica se o usuário está logado
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');

    if (isLoggedIn !== 'true') {
        window.location.href = '/login.html';
    } else {
        initNavigation();
        initCEPValidation();
        initCPFValidation();
        initFormCompletionCheck();
        initEstoque();
        initContasReceber();
        initRelatorios();
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
            errorMessage.textContent = "";
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

    checkFormCompletion(); // Verifica ao carregar a página
}

// 5. Gerenciamento de Estoque
function initEstoque() {
    const entradasEstoque = [];

    document.getElementById('cadastro-entrada-estoque-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const produto = document.getElementById('produto').value;
        const quantidade = parseInt(document.getElementById('quantidade').value);
        const valorUnitario = parseFloat(document.getElementById('valor-unitario').value);
        const notaFiscal = document.getElementById('nota-fiscal').value;

        const entrada = {
            produto,
            quantidade,
            valorUnitario,
            valorTotal: quantidade * valorUnitario,
            notaFiscal,
            data: new Date().toLocaleDateString()
        };

        entradasEstoque.push(entrada);
        atualizarListaEntradasEstoque(entradasEstoque);
        event.target.reset();
    });

    document.getElementById('gerar-relatorio-estoque').addEventListener('click', function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("Relatório de Entradas de Estoque", 10, 10);
        entradasEstoque.forEach((entrada, index) => {
            const y = 20 + (index * 10);
            doc.text(`${entrada.produto} - Quantidade: ${entrada.quantidade} - Valor Unitário: R$ ${entrada.valorUnitario.toFixed(2)} - NF: ${entrada.notaFiscal}`, 10, y);
        });

        doc.save("relatorio_estoque.pdf");
    });
}

// 6. Gerenciamento de Contas a Receber
function initContasReceber() {
    const contasReceber = [];

    document.getElementById('cadastro-conta-receber-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const cliente = document.getElementById('cliente').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const dataVencimento = document.getElementById('data-vencimento').value;

        const conta = { cliente, valor, dataVencimento, paga: false, dataPagamento: null };
        contasReceber.push(conta);

        atualizarListaContasReceber(contasReceber);
        event.target.reset();
    });

    document.getElementById('gerar-relatorio-contas-receber').addEventListener('click', function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("Relatório de Contas a Receber", 10, 10);
        contasReceber.forEach((conta, index) => {
            const y = 20 + (index * 10);
            doc.text(`${conta.cliente} - R$ ${conta.valor.toFixed(2)} - ${conta.paga ? 'Recebida' : 'Pendente'}`, 10, y);
        });

        doc.save("relatorio_contas_receber.pdf");
    });
}

// Funções auxiliares
function atualizarListaEntradasEstoque(entradasEstoque) {
    const lista = document.getElementById('lista-entradas-estoque');
    lista.innerHTML = '';

    entradasEstoque.forEach((entrada, index) => {
        const item = document.createElement('li');
        item.innerHTML = `
            <strong>Produto:</strong> ${entrada.produto} |
            <strong>Quantidade:</strong> ${entrada.quantidade} |
            <strong>Valor Unitário:</strong> R$ ${entrada.valorUnitario.toFixed(2)} |
            <strong>Valor Total:</strong> R$ ${entrada.valorTotal.toFixed(2)} |
            <strong>Nota Fiscal:</strong> ${entrada.notaFiscal} |
            <strong>Data:</strong> ${entrada.data}
        `;
        lista.appendChild(item);
    });
}

function atualizarListaContasReceber(contasReceber) {
    const lista = document.getElementById('lista-contas-receber');
    lista.innerHTML = '';

    contasReceber.forEach((conta, index) => {
        const item = document.createElement('li');
        item.innerHTML = `
            ${conta.cliente} - R$ ${conta.valor.toFixed(2)} - Vencimento: ${conta.dataVencimento}
            <button onclick="marcarComoRecebida(${index})">${conta.paga ? 'Recebida' : 'Receber'}</button>
        `;
        lista.appendChild(item);
    });
}

function marcarComoRecebida(index) {
    const conta = contasReceber[index];
    const hoje = new Date().toISOString().split('T')[0];
    const vencimento = new Date(conta.dataVencimento);
    const dataPagamento = new Date(hoje);

    if (dataPagamento > vencimento) {
        const diasAtraso = Math.ceil((dataPagamento - vencimento) / (1000 * 60 * 60 * 24));
        const juros = conta.valor * 0.02 * diasAtraso; // 2% de juros ao dia
        const multa = conta.valor * 0.05; // 5% de multa
        conta.valor += juros + multa;
    }

    conta.paga = true;
    conta.dataPagamento = hoje;
    atualizarListaContasReceber(contasReceber);
}

// Logout
document.getElementById('logout-button').addEventListener('click', function () {
    sessionStorage.removeItem('isLoggedIn'); // Remove o status de logado
    window.location.href = '/index.html'; // Redireciona para a página de login
});

// Função para atualizar o fluxo de caixa
function atualizarFluxoCaixa() {
    fetch('/financeiro')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const entradas = data.financeiro
                    .filter(item => item.tipo === 'entrada')
                    .reduce((total, item) => total + parseFloat(item.valor), 0);

                const saidas = data.financeiro
                    .filter(item => item.tipo === 'saida')
                    .reduce((total, item) => total + parseFloat(item.valor), 0);

                const saldoAnterior = 0; // Pode ser ajustado conforme necessário
                const saldoFinal = saldoAnterior + entradas - saidas;

                // Atualiza os valores na tela
                document.getElementById('saldo-anterior').textContent = saldoAnterior.toFixed(2);
                document.getElementById('entradas').textContent = entradas.toFixed(2);
                document.getElementById('saidas').textContent = saidas.toFixed(2);
                document.getElementById('saldo-final').textContent = saldoFinal.toFixed(2);
            } else {
                console.error('Erro ao buscar dados do financeiro:', data.message);
            }
        })
        .catch(error => console.error('Erro ao atualizar fluxo de caixa:', error));
}

// Inicializa o fluxo de caixa ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
    // Verifica se o usuário está logado
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');

    if (isLoggedIn !== 'true') {
        window.location.href = '/login.html';
    } else {
        initNavigation();
        initCEPValidation();
        initCPFValidation();
        initFormCompletionCheck();
        initEstoque();
        initContasReceber();
        initRelatorios();
        atualizarFluxoCaixa(); // Atualiza o fluxo de caixa ao carregar a página
    }
});

// Atualiza o fluxo de caixa após cadastrar uma entrada/saída
document.getElementById('tesouraria-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const tipo = document.getElementById('tipo').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const descricao = document.getElementById('descricao').value;

    fetch('/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, valor, descricao }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Lançamento cadastrado com sucesso!');
                atualizarFluxoCaixa(); // Atualiza o fluxo de caixa após o cadastro
                event.target.reset();
            } else {
                alert('Erro ao cadastrar lançamento: ' + data.message);
            }
        })
        .catch(error => console.error('Erro ao cadastrar lançamento:', error));
});