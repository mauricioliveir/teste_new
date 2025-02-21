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
        const query = 'SELECT * FROM usuarios WHERE email = ? AND password = ?';
        const [rows] = await db.execute(query, [email, password]);

        if (rows.length > 0) {
            const user = rows[0];
            res.status(200).json({
                message: 'Login bem-sucedido!',
                username: user.nome, // Retorna o nome do usuário
            });
        } else {
            res.status(401).json({ message: 'Email ou senha incorretos.' });
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro ao conectar ao servidor.' });
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
        
        const resetToken = Math.random().toString(36).substr(2, 8); // Gerar um token simples (idealmente, use JWT ou UUID)
        await pool.query('UPDATE public.users SET reset_token = $1 WHERE email = $2', [resetToken, email]);

        const resetLink = `http://localhost:${port}/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Redefinição de Senha',
            text: `Use este link para redefinir sua senha: ${resetLink}`,
        });

        res.json({ success: true, message: 'E-mail de redefinição enviado!' });
    } catch (err) {
        console.error('Erro ao solicitar redefinição de senha:', err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

// Rota para listar usuários
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.users');
        res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
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
