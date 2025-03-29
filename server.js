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
        // 1. Consulta ao banco de dados
        const result = await pool.query("SELECT * FROM tesouraria ORDER BY data DESC");

        // 2. Processamento dos dados
        let lancamentos = [];
        let totalEntradas = 0;
        let totalSaidas = 0;

        result.rows.forEach((item) => {
            const valor = parseFloat(item.valor);
            const dataFormatada = moment(item.data)
                .tz("America/Sao_Paulo")
                .format("DD/MM/YYYY - HH:mm");

            if (item.tipo === "entrada") {
                totalEntradas += valor;
            } else {
                totalSaidas += valor;
            }

            lancamentos.push({
                data: dataFormatada,
                tipo: item.tipo.toUpperCase(),
                descricao: item.descricao,
                valor: valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                isEntrada: item.tipo === "entrada"
            });
        });

        const saldoFinal = totalEntradas - totalSaidas;

        // 3. Configuração do PDF
        const doc = new PDFDocument({ 
            margin: 30,
            size: 'A4',
            bufferPages: true,
            font: 'Helvetica'
        });

        // Configura para download automático
        const fileName = `relatorio-financeiro-${moment().format('DD-MM-YYYY')}.pdf`;
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // 4. Cores e estilos
        const colors = {
            primary: '#2c3e50',
            success: '#27ae60',
            danger: '#e74c3c',
            light: '#f8f9fa',
            text: '#333333'
        };

        // 5. Cabeçalho (com logo)
        const logoPath = path.join(__dirname, "public", "assets", "senac-logo-0.png");
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 30, 20, { width: 80 });
        }

        doc.fontSize(16)
           .fillColor(colors.primary)
           .text("RELATÓRIO FINANCEIRO", { 
               align: "right",
               width: 400,
               lineGap: 5
           })
           .moveDown(0.2);

        doc.fontSize(8)
           .fillColor('#7f8c8d')
           .text(`Emitido em: ${moment().tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm")}`, {
               align: "right",
               width: 400
           })
           .moveDown(1.5);

        // 6. Resumo Financeiro (card)
        const resumoY = doc.y;
        doc.roundedRect(30, resumoY, 535, 60, 5)
           .fill(colors.light)
           .stroke(colors.primary);

        doc.fontSize(10)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text("RESUMO FINANCEIRO", 40, resumoY + 10);

        const colWidth = 170;
        doc.font('Helvetica')
           .text("Total Entradas", 40, resumoY + 25)
           .text("Total Saídas", 40 + colWidth, resumoY + 25)
           .text("Saldo Final", 40 + colWidth * 2, resumoY + 25);

        doc.fontSize(12)
           .fillColor(colors.success)
           .text(`R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 40, resumoY + 38)
           .fillColor(colors.danger)
           .text(`R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 40 + colWidth, resumoY + 38)
           .fillColor(saldoFinal >= 0 ? colors.success : colors.danger)
           .text(`R$ ${Math.abs(saldoFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 40 + colWidth * 2, resumoY + 38)
           .text(saldoFinal >= 0 ? "(Positivo)" : "(Negativo)", 40 + colWidth * 2, resumoY + 52, {
               fontSize: 8
           });

        doc.y = resumoY + 70;

        // 7. Tabela de Lançamentos (ajustada)
        doc.fontSize(12)
           .fillColor(colors.primary)
           .text("LANÇAMENTOS", { 
               align: "center", // Centralizado
               underline: true 
           })
           .moveDown(0.5);

        if (lancamentos.length === 0) {
            doc.fontSize(10)
               .text("Nenhum lançamento registrado no período")
               .moveDown();
        } else {
            // Configurações das colunas (sem emojis)
            const columns = [
                { header: "Data", key: "data", width: 100, align: "left" },
                { header: "Tipo", key: "tipo", width: 70, align: "center" },
                { header: "Descrição", key: "descricao", width: 240, align: "left" },
                { header: "Valor (R$)", key: "valor", width: 80, align: "right" }
            ];

            const rowHeight = 20;
            const tableTop = doc.y;
            const tableLeft = 30;

            // Cabeçalho da tabela
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .fillColor('#ffffff')
               .rect(tableLeft, tableTop, 535, rowHeight)
               .fill(colors.primary);

            let x = tableLeft;
            columns.forEach(column => {
                doc.fillColor('#ffffff')
                   .text(column.header, x + 5, tableTop + 5, {
                       width: column.width,
                       align: column.align
                   });
                x += column.width;
            });

            // Linhas da tabela
            let y = tableTop + rowHeight;
            lancamentos.forEach((item, index) => {
                const rowColor = index % 2 === 0 ? '#ffffff' : colors.light;
                
                doc.rect(tableLeft, y, 535, rowHeight)
                   .fill(rowColor);

                // Data
                doc.fontSize(9)
                   .fillColor(colors.text)
                   .text(item.data, tableLeft + 5, y + 5, {
                       width: columns[0].width,
                       align: columns[0].align
                   });

                // Tipo
                doc.fillColor(item.isEntrada ? colors.success : colors.danger)
                   .text(item.tipo, tableLeft + columns[0].width + 5, y + 5, {
                       width: columns[1].width,
                       align: columns[1].align
                   });

                // Descrição
                doc.fillColor(colors.text)
                   .text(item.descricao, tableLeft + columns[0].width + columns[1].width + 5, y + 5, {
                       width: columns[2].width,
                       align: columns[2].align
                   });

                // Valor
                doc.fillColor(item.isEntrada ? colors.success : colors.danger)
                   .text(item.valor, tableLeft + columns[0].width + columns[1].width + columns[2].width + 5, y + 5, {
                       width: columns[3].width,
                       align: columns[3].align
                   });

                y += rowHeight;
            });

            doc.y = y + 15;
        }

        // 8. Rodapé
        doc.fontSize(8)
           .fillColor('#7f8c8d')
           .text("© Sistema de Tesouraria - Relatório gerado automaticamente", 30, doc.page.height - 30, {
               width: 535,
               align: "center"
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