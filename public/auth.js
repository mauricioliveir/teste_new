require('dotenv').config(); // Carregar variáveis de ambiente
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

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
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Middleware para permitir CORS e parsear JSON
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota para registro de usuário
app.post('/register', async (req, res) => {
    console.log('Recebida requisição de registro:', req.body);
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
        console.log('Usuário registrado com sucesso:', result.rows[0]);
        res.json({ success: true, message: 'Usuário registrado com sucesso!', user: result.rows[0] });
    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para login
app.post('/login', async (req, res) => {
    console.log('Recebida requisição de login:', req.body);
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM public.users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) {
            console.log('Login bem-sucedido:', result.rows[0]);
            res.json({ success: true, message: 'Login bem-sucedido!', user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
        }
    } catch (err) {
        console.error('Erro ao fazer login:', err);
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