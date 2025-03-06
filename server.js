require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');

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

// Rota para cadastrar conta a pagar
app.post('/contas-a-pagar', async (req, res) => {
    const { descricao, valor, vencimento } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO public.contas_a_pagar (descricao, valor, vencimento) VALUES ($1, $2, $3) RETURNING *',
            [descricao, valor, vencimento]
        );
        res.json({ success: true, message: 'Conta a pagar cadastrada com sucesso!', conta: result.rows[0] });
    } catch (err) {
        console.error('Erro ao cadastrar conta a pagar:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para listar contas a pagar
app.get('/contas-a-pagar', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.contas_a_pagar');
        res.json({ success: true, contas: result.rows });
    } catch (err) {
        console.error('Erro ao buscar contas a pagar:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para cadastrar conta a receber
app.post('/contas-a-receber', async (req, res) => {
    const { descricao, valor, vencimento } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO public.contas_a_receber (descricao, valor, vencimento) VALUES ($1, $2, $3) RETURNING *',
            [descricao, valor, vencimento]
        );
        res.json({ success: true, message: 'Conta a receber cadastrada com sucesso!', conta: result.rows[0] });
    } catch (err) {
        console.error('Erro ao cadastrar conta a receber:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para listar contas a receber
app.get('/contas-a-receber', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.contas_a_receber');
        res.json({ success: true, contas: result.rows });
    } catch (err) {
        console.error('Erro ao buscar contas a receber:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para cadastrar fluxo de caixa
app.post('/fluxo-caixa', async (req, res) => {
    const { tipo, valor, descricao } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO public.fluxo_caixa (tipo, valor, descricao) VALUES ($1, $2, $3) RETURNING *',
            [tipo, valor, descricao]
        );
        res.json({ success: true, message: 'Fluxo de caixa registrado com sucesso!', fluxo: result.rows[0] });
    } catch (err) {
        console.error('Erro ao registrar fluxo de caixa:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para listar fluxo de caixa
app.get('/fluxo-caixa', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.fluxo_caixa');
        res.json({ success: true, fluxo: result.rows });
    } catch (err) {
        console.error('Erro ao buscar fluxo de caixa:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para gerar PDF de contas a pagar
app.get('/gerar-pdf-contas-a-pagar', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.contas_a_pagar');

        const doc = new PDFDocument();
        let filename = 'contas_a_pagar.pdf';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        doc.pipe(res);

        doc.fontSize(20).text('Contas a Pagar', { align: 'center' });
        doc.moveDown();

        result.rows.forEach(conta => {
            doc.fontSize(12).text(`Descrição: ${conta.descricao}`);
            doc.text(`Valor: R$ ${conta.valor.toFixed(2)}`);
            doc.text(`Vencimento: ${conta.vencimento}`);
            doc.moveDown();
        });

        doc.end();
    } catch (err) {
        console.error('Erro ao gerar PDF de contas a pagar:', err);
        res.status(500).json({ success: false, message: 'Erro ao gerar PDF.' });
    }
});

// Rota para gerar PDF de contas a receber
app.get('/gerar-pdf-contas-a-receber', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.contas_a_receber');

        const doc = new PDFDocument();
        let filename = 'contas_a_receber.pdf';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        doc.pipe(res);

        doc.fontSize(20).text('Contas a Receber', { align: 'center' });
        doc.moveDown();

        result.rows.forEach(conta => {
            doc.fontSize(12).text(`Descrição: ${conta.descricao}`);
            doc.text(`Valor: R$ ${conta.valor.toFixed(2)}`);
            doc.text(`Vencimento: ${conta.vencimento}`);
            doc.moveDown();
        });

        doc.end();
    } catch (err) {
        console.error('Erro ao gerar PDF de contas a receber:', err);
        res.status(500).json({ success: false, message: 'Erro ao gerar PDF.' });
    }
});

// Rota para gerar PDF de fluxo de caixa
app.get('/gerar-pdf-fluxo-caixa', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.fluxo_caixa');

        const doc = new PDFDocument();
        let filename = 'fluxo_caixa.pdf';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        doc.pipe(res);

        doc.fontSize(20).text('Fluxo de Caixa', { align: 'center' });
        doc.moveDown();

        result.rows.forEach(fluxo => {
            doc.fontSize(12).text(`Tipo: ${fluxo.tipo}`);
            doc.text(`Valor: R$ ${fluxo.valor.toFixed(2)}`);
            doc.text(`Descrição: ${fluxo.descricao}`);
            doc.moveDown();
        });

        doc.end();
    } catch (err) {
        console.error('Erro ao gerar PDF de fluxo de caixa:', err);
        res.status(500).json({ success: false, message: 'Erro ao gerar PDF.' });
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