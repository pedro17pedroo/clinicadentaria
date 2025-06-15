import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { storage } from './storage';
import { IUser } from '../shared/schema';

const router = express.Router();

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password é obrigatório')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
  di: z.string().optional(),
  phone: z.string().optional(),
  userType: z.enum(['admin', 'employee', 'doctor']).default('employee')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password atual é obrigatório'),
  newPassword: z.string().min(8, 'Nova password deve ter pelo menos 8 caracteres')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z.string().min(8, 'Nova password deve ter pelo menos 8 caracteres')
});

// Middleware para verificar JWT
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Buscar utilizador por email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar password
    if (!user.password) {
      return res.status(401).json({ message: 'Utilizador não tem password definida. Use login OAuth.' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        userType: user.userType,
        name: user.name
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    // Remover password da resposta
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      token,
      user: userWithoutPassword,
      message: 'Login realizado com sucesso'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota de registo (apenas para admins)
router.post('/register', verifyToken, async (req: any, res) => {
  try {
    // Verificar se o utilizador atual é admin
    const currentUser = await storage.getUser(req.user.userId);
    if (currentUser?.userType !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem registar novos utilizadores' });
    }
    
    const userData = registerSchema.parse(req.body);
    
    // Verificar se email já existe
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    
    // Hash da password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Criar utilizador
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      mustChangePassword: true // Forçar mudança de password no primeiro login
    });
    
    // Remover password da resposta
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      user: userWithoutPassword,
      message: 'Utilizador criado com sucesso'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro no registo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para alterar password
router.post('/change-password', verifyToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    // Buscar utilizador atual
    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }
    
    // Verificar password atual (se existir)
    if (user.password) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Password atual incorreta' });
      }
    }
    
    // Hash da nova password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Atualizar password
    await storage.updateUserPassword(user._id, hashedPassword);
    
    res.json({ message: 'Password alterada com sucesso' });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao alterar password:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para solicitar reset de password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    // Buscar utilizador por email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      return res.json({ message: 'Se o email existir, receberá instruções para reset da password' });
    }
    
    // Gerar token de reset (válido por 10 minutos)
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '10m' }
    );
    
    // Guardar token de reset no utilizador
    await storage.setPasswordResetToken(user._id, resetToken);
    
    // TODO: Enviar email com link de reset
    // Por agora, apenas log do link completo (em produção, enviar por email)
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log(`\n🔗 Link de recuperação de senha para ${email}:`);
    console.log(`${resetLink}`);
    console.log(`⏰ Link válido por 10 minutos\n`);
    
    res.json({ message: 'Se o email existir, receberá instruções para reset da password' });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao solicitar reset de password:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para reset de password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    
    // Verificar token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch (error) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }
    
    // Buscar utilizador
    const user = await storage.getUser(decoded.userId);
    if (!user || user.passwordResetToken !== token) {
      return res.status(400).json({ message: 'Token inválido' });
    }
    
    // Hash da nova password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Atualizar password e remover token de reset
    await storage.updateUserPassword(user._id, hashedPassword);
    await storage.clearPasswordResetToken(user._id);
    
    res.json({ message: 'Password redefinida com sucesso' });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao redefinir password:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para verificar se deve mudar password
router.get('/must-change-password', verifyToken, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }
    
    res.json({ mustChangePassword: user.mustChangePassword || false });
    
  } catch (error) {
    console.error('Erro ao verificar status de password:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export { router as authRoutes, verifyToken };