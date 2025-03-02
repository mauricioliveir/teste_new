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

// Função para inicializar a geração de relatórios
function initRelatorios() {
    // Relatório de Funcionários
    document.getElementById('gerar-relatorio-funcionarios').addEventListener('click', async function () {
        try {
            const response = await fetch('/funcionarios');
            const data = await response.json();
            if (data.success) {
                gerarPDFFuncionarios(data.funcionarios);
            } else {
                alert('Erro ao buscar funcionários.');
            }
        } catch (error) {
            console.error('Erro ao gerar relatório de funcionários:', error);
            alert('Erro ao conectar ao servidor.');
        }
    });

    // Relatório de Financeiro
    document.getElementById('gerar-relatorio-financeiro').addEventListener('click', async function () {
        try {
            const response = await fetch('/financeiro');
            const data = await response.json();
            if (data.success) {
                gerarPDFFinanceiro(data.financeiro);
            } else {
                alert('Erro ao buscar dados financeiros.');
            }
        } catch (error) {
            console.error('Erro ao gerar relatório financeiro:', error);
            alert('Erro ao conectar ao servidor.');
        }
    });

    // Relatório de Vendas
    document.getElementById('gerar-relatorio-vendas').addEventListener('click', async function () {
        try {
            const response = await fetch('/vendas');
            const data = await response.json();
            if (data.success) {
                gerarPDFVendas(data.vendas);
            } else {
                alert('Erro ao buscar vendas.');
            }
        } catch (error) {
            console.error('Erro ao gerar relatório de vendas:', error);
            alert('Erro ao conectar ao servidor.');
        }
    });

    // Relatório de Estoque
    document.getElementById('gerar-relatorio-estoque').addEventListener('click', async function () {
        try {
            const response = await fetch('/estoque');
            const data = await response.json();
            if (data.success) {
                gerarPDFEstoque(data.estoque);
            } else {
                alert('Erro ao buscar estoque.');
            }
        } catch (error) {
            console.error('Erro ao gerar relatório de estoque:', error);
            alert('Erro ao conectar ao servidor.');
        }
    });
}

// Funções para gerar PDFs
function gerarPDFFuncionarios(funcionarios) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório de Funcionários", 10, 10);
    funcionarios.forEach((funcionario, index) => {
        const y = 20 + (index * 10);
        doc.text(`${funcionario.nome} - ${funcionario.cpf} - ${funcionario.cargo_admitido}`, 10, y);
    });

    doc.save("relatorio_funcionarios.pdf");
}

function gerarPDFFinanceiro(financeiro) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório Financeiro", 10, 10);
    financeiro.forEach((item, index) => {
        const y = 20 + (index * 10);
        doc.text(`${item.tipo} - R$ ${item.valor.toFixed(2)} - ${item.descricao}`, 10, y);
    });

    doc.save("relatorio_financeiro.pdf");
}

function gerarPDFVendas(vendas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório de Vendas", 10, 10);
    vendas.forEach((venda, index) => {
        const y = 20 + (index * 10);
        doc.text(`${venda.cliente} - ${venda.produto} - R$ ${venda.valor.toFixed(2)}`, 10, y);
    });

    doc.save("relatorio_vendas.pdf");
}

function gerarPDFEstoque(estoque) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório de Estoque", 10, 10);
    estoque.forEach((item, index) => {
        const y = 20 + (index * 10);
        doc.text(`${item.produto} - Quantidade: ${item.quantidade} - Valor Unitário: R$ ${item.valor_unitario.toFixed(2)}`, 10, y);
    });

    doc.save("relatorio_estoque.pdf");
}