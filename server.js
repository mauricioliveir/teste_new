const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do Pool de conexão com o PostgreSQL
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'expressly-reliable-platy.data-1.use1.tembo.io',
    database: process.env.PGDATABASE || 'postgres',
    password: process.env.PGPASSWORD || 'zkgKkrl8be0Ypqmo',
    port: process.env.PGPORT || 5432,
    ssl: {
        rejectUnauthorized: false, // Use true em produção com um certificado válido
    },
});

// Middleware para permitir CORS e parsear JSON
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rota para o registro
app.post('/register', async (req, res) => {
    const { nome, email, password } = req.body;

    try {
        // Verifique se o usuário já existe
        const userExists = await pool.query(
            'SELECT * FROM public.users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Usuário já cadastrado.' });
        }

        // Insira o novo usuário no banco de dados
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

// Rota para o login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verifique as credenciais no banco de dados
        const result = await pool.query(
            'SELECT * FROM public.users WHERE email = $1 AND password = $2',
            [email, password]
        );

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

// Rota padrão para servir o arquivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});