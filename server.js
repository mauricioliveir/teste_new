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
        // [1] Consulta e processamento dos dados (mantido igual)
        const result = await pool.query("SELECT * FROM tesouraria ORDER BY data DESC");
        
        let lancamentos = [];
        let totalEntradas = 0;
        let totalSaidas = 0;

        result.rows.forEach(item => {
            const valor = parseFloat(item.valor);
            if (item.tipo === "entrada") totalEntradas += valor;
            else totalSaidas += valor;

            lancamentos.push({
                data: moment(item.data).tz("America/Sao_Paulo").format("DD/MM/YYYY - HH:mm"),
                tipo: item.tipo.toUpperCase(),
                descricao: item.descricao,
                valor: valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                isEntrada: item.tipo === "entrada"
            });
        });

        const saldoFinal = totalEntradas - totalSaidas;

        // [2] Configuração do PDF
        const doc = new PDFDocument({
            margin: 40,
            size: 'A4',
            font: 'Helvetica'
        });

        res.setHeader('Content-Disposition', `attachment; filename="relatorio-financeiro-${moment().format('YYYY-MM-DD')}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        const colors = {
            primary: '#2c3e50',
            success: '#27ae60',
            danger: '#e74c3c',
            light: '#f5f5f5'
        };

        // [3] Cabeçalho
        doc.image(path.join(__dirname, 'public', 'assets', 'senac-logo-0.png'), 40, 30, { width: 80 })
           .fontSize(18)
           .fillColor(colors.primary)
           .text('RELATÓRIO FINANCEIRO', 130, 45);

        // [4] Resumo Financeiro (mantido igual)
        doc.rect(40, 90, 515, 70)
        .fill(colors.light)
        .stroke(colors.primary);

     doc.fontSize(12)
        .fillColor(colors.primary)
        .text('RESUMO FINANCEIRO', 50, 100, { underline: true });

     const colWidth = 150;
     doc.fontSize(10)
        .text('Total Entradas', 50, 120)
        .text('Total Saídas', 50 + colWidth, 120)
        .text('Saldo Final', 50 + colWidth * 2, 120);

     doc.fontSize(12)
        .fillColor(colors.success)
        .text(`R$ ${totalEntradas.toFixed(2)}`, 50, 135)
        .fillColor(colors.danger)
        .text(`R$ ${totalSaidas.toFixed(2)}`, 50 + colWidth, 135)
        .fillColor(saldoFinal >= 0 ? colors.success : colors.danger)
        .text(`R$ ${Math.abs(saldoFinal).toFixed(2)}`, 50 + colWidth * 2, 135);


        // [5] Tabela de Lançamentos (com centralização matemática)
        const tableTop = 180;
        const titleText = 'LANÇAMENTOS';
        const titleWidth = doc.widthOfString(titleText);
        const centerX = (doc.page.width - titleWidth) / 2;
        
        doc.fontSize(14)
           .fillColor(colors.primary)
           .text(titleText, centerX, tableTop, { underline: true })
           .moveDown(1);

           if (lancamentos.length > 0) {
            // Cabeçalho da tabela
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .fillColor('#fff')
               .rect(40, tableTop + 30, 515, 20)
               .fill(colors.primary);

            doc.fillColor('#ffffff')
               .text('Data', 45, tableTop + 35, { width: 100 })
               .text('Tipo', 155, tableTop + 35, { width: 70, align: "center" })
               .text('Descrição', 235, tableTop + 35, { width: 200 })
               .text('Valor (R$)', 445, tableTop + 35, { width: 100, align: "right" });

            // Linhas da tabela
            let y = tableTop + 50;
            lancamentos.forEach((item, index) => {
                doc.rect(40, y, 515, 20)
                   .fill(index % 2 === 0 ? '#fff' : colors.light);

                doc.fontSize(9)
                   .fillColor(colors.primary)
                   .text(item.data, 45, y + 5, { width: 100 })
                   .fillColor(item.isEntrada ? colors.success : colors.danger)
                   .text(item.tipo, 155, y + 5, { width: 70, align: "center" })
                   .fillColor(colors.primary)
                   .text(item.descricao, 235, y + 5, { width: 200 })
                   .fillColor(item.isEntrada ? colors.success : colors.danger)
                   .text(item.valor, 445, y + 5, { width: 100, align: "right" });

                y += 20;
            });
        }

        doc.end();
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
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