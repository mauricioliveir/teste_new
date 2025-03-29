require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require('path');

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

app.get("/relatorio-financeiro", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tesouraria ORDER BY data DESC");

        let entradas = 0;
        let saidas = 0;

        result.rows.forEach((item) => {
            if (item.tipo === "entrada") {
                entradas += parseFloat(item.valor);
            } else {
                saidas += parseFloat(item.valor);
            }
        });

        const saldoFinal = entradas - saidas;

        // Criar documento PDF em memória
        const doc = new PDFDocument();
        res.setHeader("Content-Disposition", "inline; filename=relatorio-financeiro.pdf");
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

        // Cabeçalho do relatório
        doc.fontSize(18).text("Relatório Financeiro", { align: "center" }).moveDown();
        doc.fontSize(12).text(`Entradas: R$ ${entradas.toFixed(2)}`);
        doc.text(`Saídas: R$ ${saidas.toFixed(2)}`);
        doc.text(`Saldo Final: R$ ${saldoFinal.toFixed(2)}`).moveDown();

        // Listar lançamentos
        doc.fontSize(14).text("Lançamentos:", { underline: true }).moveDown();
        result.rows.forEach((item) => {
            doc.fontSize(12).text(
                `${item.data}: ${item.tipo.toUpperCase()} - R$ ${parseFloat(item.valor).toFixed(2)} - ${item.descricao}`
            );
        });

        doc.end(); // Finaliza o stream e envia o PDF na resposta

    } catch (err) {
        console.error("Erro ao gerar relatório:", err);
        res.status(500).json({ success: false, message: "Erro ao gerar relatório" });
    }
});

// Rota para registrar uma venda
app.post('/vendas', async (req, res) => {
    const { cliente, produto, valor } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO vendas (cliente, produto, valor) VALUES ($1, $2, $3) RETURNING *',
            [cliente, produto, valor]
        );
        res.json({ success: true, message: 'Venda registrada com sucesso!', venda: result.rows[0] });
    } catch (err) {
        console.error('Erro ao registrar venda:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para listar todas as vendas
app.get('/vendas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vendas ORDER BY data DESC');
        res.json({ success: true, vendas: result.rows });
    } catch (err) {
        console.error('Erro ao buscar vendas:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para gerar relatório de vendas em PDF
app.get('/relatorio-vendas', async (req, res) => {
    try {
        const vendas = await pool.query('SELECT * FROM vendas ORDER BY data DESC');

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio-vendas.pdf');

        doc.pipe(res);

        doc.fontSize(16).text('Relatório de Vendas', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text('Vendas Registradas:', { underline: true });
        vendas.rows.forEach((venda, index) => {
            doc.text(`${index + 1}. Cliente: ${venda.cliente}, Produto: ${venda.produto}, Valor: R$ ${venda.valor.toFixed(2)}, Data: ${venda.data.toLocaleString()}`);
        });

        doc.end();
    } catch (err) {
        console.error('Erro ao gerar relatório de vendas:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
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