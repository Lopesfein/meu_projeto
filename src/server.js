import bcrypt from "bcrypt";
import db from "./db.js";
import cors from "cors";
import nodemailer from "nodemailer";
import crypto from "crypto";
import express from "express";

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || 'empresaecoclothes@gmail.com',
        pass: process.env.EMAIL_PASS || 'akzj jgsy wmpm krgz' // MOVA ISSO PARA .env!
    }
});

// Função para enviar email de recuperação
const sendRecoveryEmail = async (emailDestino, recoveryLink) => {
    try {
        await transporter.sendMail({
            from: '"Eco Clothes Suporte" <empresaecoclothes@gmail.com>',
            to: emailDestino,
            subject: 'Recuperação de Senha - Eco Clothes',
            html: `
                <h1>Recuperação de Senha</h1>
                <p>Recebemos uma solicitação de recuperação de senha para esta conta.</p>
                <p>Clique no link abaixo para criar uma nova senha:</p>
                <a href="${recoveryLink}">${recoveryLink}</a>
                <p><strong>Este link expira em 1 hora.</strong></p>
                <p>Se você não solicitou isso, ignore este e-mail.</p>
            `
        });
        console.log(`[EMAIL] Enviado para: ${emailDestino}`);
    } catch (error) {
        console.error('[EMAIL ERRO]:', error);
        throw new Error("Falha no envio de e-mail");
    }
};

// ROTA: Cadastro de usuário
app.post("/register", async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    if (senha.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    try {
        const hash = await bcrypt.hash(senha, 10);
        const sql = 'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)';
        
        db.query(sql, [nome, email, hash], (err) => {
            if (err) {
                console.error(err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'E-mail já cadastrado' });
                }
                return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
            }
            res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// ROTA: Login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos' });
        }

        const user = results[0];

        try {
            const match = await bcrypt.compare(senha, user.senha);
            if (!match) {
                return res.status(401).json({ error: 'E-mail ou senha incorretos' });
            }
            res.json({ message: 'Login realizado com sucesso!', userId: user.id });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao verificar senha' });
        }
    });
});

// ROTA: Solicitar recuperação de senha
app.post('/recover', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Informe o e-mail' });
    }

    const sql = 'SELECT id FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        if (results.length === 0) {
            // Por segurança, não informar que o email não existe
            return res.status(200).json({ 
                message: 'Se o e-mail estiver cadastrado, você receberá o link de recuperação.' 
            });
        }

        const userId = results[0].id;
        
        // Gera token seguro
        const recoveryToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora

        // Salva token no banco
        const sqlToken = 'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?';
        db.query(sqlToken, [userId, recoveryToken, expiresAt, recoveryToken, expiresAt], async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao processar recuperação' });
            }

            const recoveryLink = `http://localhost:5500/public/reset-senha.html?token=${recoveryToken}&id=${userId}`;

            try {
                await sendRecoveryEmail(email, recoveryLink);
                res.status(200).json({ 
                    message: 'Link de recuperação enviado! Verifique seu e-mail.' 
                });
            } catch (emailError) {
                res.status(500).json({ 
                    error: 'Erro ao enviar e-mail. Tente novamente.' 
                });
            }
        });
    });
});

// ROTA: Redefinir senha
app.post('/reset-password', async (req, res) => {
    const { userId, token, novaSenha } = req.body;

    if (!userId || !token || !novaSenha) {
        return res.status(400).json({ error: 'Dados incompletos' });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Verifica token
    const sqlToken = 'SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND expires_at > NOW()';
    db.query(sqlToken, [userId, token], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Link inválido ou expirado' });
        }

        try {
            const hash = await bcrypt.hash(novaSenha, 10);
            const sqlUpdate = 'UPDATE users SET senha = ? WHERE id = ?';
            
            db.query(sqlUpdate, [hash, userId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Erro ao atualizar senha' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Usuário não encontrado' });
                }

                // Remove o token usado
                db.query('DELETE FROM password_resets WHERE user_id = ?', [userId]);

                res.status(200).json({ message: 'Senha alterada com sucesso!' });
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao processar senha' });
        }
    });
});

app.listen(3000, () => {
    console.log("🚀 Servidor rodando na porta 3000");
});