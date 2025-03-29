require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require('path');
const moment = require("moment-timezone");
const { addTable } = require('pdfkit-table')

const app = express();
const port = process.env.PORT || 3000;

// Configuração do Pool de conexão com o PostgreSQL
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Configuração do transporte de e-mail com Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // Para SSL/TLS, usar a porta 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Middleware para permitir CORS e parsear JSON
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota para registro de usuário
app.post('/register', async (req, res) => {
    const { nome, email, password } = req.body;
    try {
        const userExists = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Usuário já cadastrado.' });
        }
        const result = await pool.query(
            'INSERT INTO public.users (nome, email, password) VALUES ($1, $2, $3) RETURNING *',
            [nome, email, password]
        );
        res.json({ success: true, message: 'Usuário registrado com sucesso!', user: result.rows[0] });
    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM public.users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Login bem-sucedido!', user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
        }
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para solicitação de redefinição de senha
app.post('/reset-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'E-mail não encontrado.' });
        }

        const userPassword = user.rows[0].password;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperação de Senha',
            text: `Sua senha cadastrada é: ${userPassword}. Recomendamos que altere sua senha assim que possível.`,
        });

        res.json({ success: true, message: 'Senha enviada para seu e-mail!' });

    } catch (err) {
        console.error('Erro ao solicitar redefinição de senha:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para cadastro de funcionário
app.post('/funcionarios', async (req, res) => {
    const { nome, cpf, rg, filiacao, cep, logradouro, numero, bairro, cidade, estado, telefone, email, cargo_admitido, salario } = req.body;

    try {
        const funcionarioExiste = await pool.query(
            'SELECT * FROM public.funcionarios WHERE cpf = $1 OR email = $2', 
            [cpf, email]
        );

        if (funcionarioExiste.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Funcionário já cadastrado.' });
        }

        const result = await pool.query(
            `INSERT INTO public.funcionarios 
            (nome, cpf, rg, filiacao, cep, logradouro, numero, bairro, cidade, estado, telefone, email, cargo_admitido, salario) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [nome, cpf, rg, filiacao, cep, logradouro, numero, bairro, cidade, estado, telefone, email, cargo_admitido, salario]
        );

        res.json({ success: true, message: 'Funcionário cadastrado com sucesso!', funcionario: result.rows[0] });
    } catch (err) {
        console.error('Erro ao cadastrar funcionário:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para listar funcionários
app.get('/funcionarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.funcionarios');
        res.json({ success: true, funcionarios: result.rows });
    } catch (err) {
        console.error('Erro ao buscar funcionários:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para adicionar um lançamento financeiro
app.post("/tesouraria", async (req, res) => {
    const { tipo, valor, descricao } = req.body;
    
    if (!tipo || isNaN(valor) || valor <= 0 || !descricao) {
        return res.status(400).json({ success: false, message: "Dados inválidos" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO tesouraria (tipo, valor, descricao) VALUES ($1, $2, $3) RETURNING *",
            [tipo, valor, descricao]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("Erro ao inserir dados:", err);
        res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
});

// Rota para buscar todos os lançamentos e calcular fluxo de caixa
app.get("/tesouraria", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tesouraria ORDER BY data DESC");
        res.json({ success: true, lancamentos: result.rows });
    } catch (err) {
        console.error("Erro ao buscar dados:", err);
        res.status(500).json({ success: false, message: "Erro ao buscar dados" });
    }
});

// Rota para gerar relatório financeiro em PDF
app.get("/relatorio-financeiro", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tesouraria ORDER BY data DESC");

        // Organização dos dados
        let entradas = [];
        let saidas = [];
        let totalEntradas = 0;
        let totalSaidas = 0;

        result.rows.forEach((item) => {
            const dataFormatada = moment(item.data)
                .tz("America/Sao_Paulo")
                .format("DD/MM/YYYY HH:mm");
            const valorFormatado = parseFloat(item.valor).toFixed(2);

            if (item.tipo === "entrada") {
                totalEntradas += parseFloat(item.valor);
                entradas.push({ 
                    data: dataFormatada,
                    tipo: "ENTRADA",
                    valor: valorFormatado,
                    descricao: item.descricao
                });
            } else {
                totalSaidas += parseFloat(item.valor);
                saidas.push({ 
                    data: dataFormatada,
                    tipo: "SAÍDA",
                    valor: valorFormatado,
                    descricao: item.descricao
                });
            }
        });

        const saldoFinal = totalEntradas - totalSaidas;

        // Configuração do PDF
        const doc = new PDFDocument({ 
            margin: 40,
            size: 'A4',
            bufferPages: true
        });

        res.setHeader("Content-Disposition", "inline; filename=relatorio-financeiro.pdf");
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // Estilos
        const primaryColor = '#2c3e50';
        const successColor = '#27ae60';
        const dangerColor = '#e74c3c';
        const lightColor = '#ecf0f1';

        // Cabeçalho
        const logoPath = path.join(__dirname, "public", "assets", "senac-logo-0.png");
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 30, { width: 100 });
        }

        doc
            .fillColor(primaryColor)
            .fontSize(20)
            .text("RELATÓRIO FINANCEIRO", { 
                align: "center",
                underline: true,
                lineGap: 10
            })
            .moveDown(0.5);

        doc
            .fontSize(10)
            .text(`Emitido em: ${moment().tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm")}`, {
                align: "center"
            })
            .moveDown(1.5);

        // Resumo Financeiro
        doc
            .fontSize(14)
            .fillColor(primaryColor)
            .text("RESUMO FINANCEIRO", { underline: true })
            .moveDown(0.8);

        const resumoY = doc.y;
        
        // Caixa de fundo para o resumo
        doc
            .rect(40, resumoY, 520, 80)
            .fill(lightColor)
            .stroke(primaryColor);

        // Texto dentro do resumo
        doc
            .fontSize(12)
            .fillColor(primaryColor)
            .text("Total de Entradas:", 60, resumoY + 20)
            .fillColor(successColor)
            .text(`R$ ${totalEntradas.toFixed(2)}`, 200, resumoY + 20);

        doc
            .fillColor(primaryColor)
            .text("Total de Saídas:", 60, resumoY + 40)
            .fillColor(dangerColor)
            .text(`R$ ${totalSaidas.toFixed(2)}`, 200, resumoY + 40);

        doc
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text("Saldo Final:", 60, resumoY + 60)
            .fillColor(saldoFinal >= 0 ? successColor : dangerColor)
            .text(`R$ ${Math.abs(saldoFinal).toFixed(2)}`, 200, resumoY + 60)
            .text(saldoFinal >= 0 ? "(Positivo)" : "(Negativo)", 300, resumoY + 60)
            .font('Helvetica');

        doc.y = resumoY + 100;

        // Função para criar tabelas estilizadas
        function criarTabela(doc, titulo, dados) {
            // Cabeçalho da seção
            doc
                .fontSize(14)
                .fillColor(primaryColor)
                .text(titulo.toUpperCase(), { underline: true })
                .moveDown(0.5);

            if (dados.length === 0) {
                doc
                    .fontSize(10)
                    .text("Nenhum registro encontrado")
                    .moveDown(1);
                return;
            }

            // Configurações da tabela
            const colunas = [
                { nome: "Data", largura: 100, alinhamento: "left" },
                { nome: "Tipo", largura: 80, alinhamento: "center" },
                { nome: "Valor (R$)", largura: 100, alinhamento: "right" },
                { nome: "Descrição", largura: 240, alinhamento: "left" }
            ];

            const linhaAltura = 20;
            const inicioX = 40;
            let inicioY = doc.y;

            // Cabeçalho da tabela
            doc
                .font('Helvetica-Bold')
                .fillColor('#ffffff')
                .rect(inicioX, inicioY, 520, linhaAltura)
                .fill(primaryColor);

            let xAtual = inicioX;
            colunas.forEach(coluna => {
                doc
                    .text(coluna.nome, xAtual + 5, inicioY + 5, {
                        width: coluna.largura,
                        align: coluna.alinhamento
                    });
                xAtual += coluna.largura;
            });

            inicioY += linhaAltura;

            // Linhas da tabela
            dados.forEach((item, index) => {
                const corFundo = index % 2 === 0 ? '#ffffff' : lightColor;
                
                doc
                    .fillColor(primaryColor)
                    .font('Helvetica')
                    .rect(inicioX, inicioY, 520, linhaAltura)
                    .fill(corFundo);

                // Data
                doc.text(item.data, inicioX + 5, inicioY + 5, {
                    width: colunas[0].largura,
                    align: colunas[0].alinhamento
                });

                // Tipo
                doc.fillColor(item.tipo === "ENTRADA" ? successColor : dangerColor)
                    .text(item.tipo, inicioX + colunas[0].largura + 5, inicioY + 5, {
                        width: colunas[1].largura,
                        align: colunas[1].alinhamento
                    })
                    .fillColor(primaryColor);

                // Valor
                doc.text(item.valor, inicioX + colunas[0].largura + colunas[1].largura + 5, inicioY + 5, {
                    width: colunas[2].largura,
                    align: colunas[2].alinhamento
                });

                // Descrição
                doc.text(item.descricao, inicioX + colunas[0].largura + colunas[1].largura + colunas[2].largura + 5, inicioY + 5, {
                    width: colunas[3].largura,
                    align: colunas[3].alinhamento
                });

                inicioY += linhaAltura;
            });

            doc.y = inicioY + 15;
        }

        // Criar tabelas
        criarTabela(doc, "Entradas", entradas);
        criarTabela(doc, "Saídas", saidas);

        // Rodapé
        doc
            .fontSize(10)
            .fillColor('#7f8c8d')
            .text("Relatório gerado automaticamente pelo Sistema de Tesouraria", 40, doc.page.height - 40, {
                align: "center",
                width: 520
            });

        doc.end();
    } catch (err) {
        console.error("Erro ao gerar relatório:", err);
        res.status(500).json({ success: false, message: "Erro ao gerar relatório" });
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});