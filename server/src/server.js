require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const { PrismaClient } = require('@prisma/client');
const { addMonths, addWeeks, addDays, startOfDay, endOfDay, isBefore, parseISO } = require('date-fns');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

// Security Middlewares
app.use(helmet()); // Set security headers
app.set('trust proxy', 1); // Confiar no proxy reverso (Nginx)

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use(limiter);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Sanitize Data (XSS)
app.use(xss());

// Configuração do Multer para Uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size to 20MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Apenas arquivos de imagem e PDF são permitidos!'));
    }
});

// CORS Configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use('/uploads', express.static(uploadDir)); // Servir arquivos estáticos

// Middleware para remover /api se vier na URL (garantia para local dev)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace('/api', '');
    }
    next();
});

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTENTICAÇÃO ---

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

        if (user.active === false) {
            return res.status(403).json({ error: 'Conta inativa. Contate o suporte.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Senha incorreta' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, name: user.name, role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Erro no login' });
    }
});

// Middleware Admin
const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
        }
        next();
    });
};

// --- ROTAS ADMIN ---

app.get('/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                active: true,
                createdAt: true,
                plan: { select: { name: true } },
                _count: {
                    select: { clients: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

app.post('/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const { username, password, name, role, planId } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) return res.status(400).json({ error: 'Usuário já existe' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                role: role || 'USER',
                planId: planId || null,
                active: true
            }
        });

        // Se tiver plano, cria subscrição (mock por enquanto)
        if (planId) {
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    planId: planId,
                    status: 'ACTIVE',
                    gateway: 'MANUAL'
                }
            });
        }

        res.json({ id: user.id, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

app.put('/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, role, planId, password } = req.body;

        const data = {
            name,
            username,
            role,
            planId: planId || null
        };

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data
        });

        // Atualizar ou criar assinatura se o plano mudou
        if (planId) {
            const subscription = await prisma.subscription.findUnique({ where: { userId: id } });
            if (subscription) {
                await prisma.subscription.update({
                    where: { userId: id },
                    data: { planId }
                });
            } else {
                await prisma.subscription.create({
                    data: {
                        userId: id,
                        planId,
                        status: 'ACTIVE',
                        gateway: 'MANUAL'
                    }
                });
            }
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

app.put('/admin/users/:id/toggle-status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { active: !user.active }
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

app.delete('/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevenir auto-exclusão
        if (id === req.user.id) {
            return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Deleção em cascata manual para garantir integridade
        await prisma.$transaction(async (tx) => {
            // 1. Deletar Clientes (Isso deleta empréstimos e documentos se o DB estiver com cascade, 
            // mas por segurança vamos limpar dependências explícitas se possível ou confiar no deleteMany)
            // O proproschema diz onDelete: Cascade para Loans -> Client, então deletar Client resolve Loans.
            await tx.client.deleteMany({ where: { userId: id } });

            // 2. Deletar Parceiros (Empréstimos já foram, então ok)
            await tx.partner.deleteMany({ where: { userId: id } });

            // 3. Deletar Transações
            await tx.transaction.deleteMany({ where: { userId: id } });

            // 4. Deletar Assinatura e Pagamentos
            const subscription = await tx.subscription.findUnique({ where: { userId: id } });
            if (subscription) {
                await tx.payment.deleteMany({ where: { subscriptionId: subscription.id } });
                await tx.subscription.delete({ where: { id: subscription.id } });
            }

            // 5. Finalmente deletar o usuário
            await tx.user.delete({ where: { id } });
        });

        res.json({ success: true, message: 'Usuário e todos os dados vinculados foram excluídos com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário: ' + error.message });
    }
});

app.get('/admin/plans', authenticateAdmin, async (req, res) => {
    try {
        const plans = await prisma.plan.findMany();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar planos' });
    }
});

app.post('/admin/plans', authenticateAdmin, async (req, res) => {
    try {
        const { name, price, description, maxClients, maxLoans } = req.body;
        const plan = await prisma.plan.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                maxClients: parseInt(maxClients),
                maxLoans: parseInt(maxLoans)
            }
        });
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar plano' });
    }
});

app.delete('/admin/plans/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.plan.delete({ where: { id } });
        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir plano' });
    }
});

app.get('/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalClients = await prisma.client.count();
        const totalLoans = await prisma.loan.count();

        // Soma total emprestado em todo o sistema
        const totalLoanedResult = await prisma.loan.aggregate({
            _sum: { amount: true }
        });

        res.json({
            totalUsers,
            totalClients,
            totalLoans,
            totalLoaned: totalLoanedResult._sum.amount || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

/*
// Rota Desativada por Segurança - Use o Painel Admin para criar usuários
app.post('/register', async (req, res) => {
    const { username, password, name } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) return res.status(400).json({ error: 'Usuário já existe' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, password: hashedPassword, name }
        });
        res.json({ id: user.id, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});
*/

// --- ROTAS DE CLIENTES (SaaS) ---

app.get('/clients', authenticateToken, async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            where: { userId: req.user.id },
            include: {
                loans: {
                    include: { installments: true }
                },
                documents: true
            },
            orderBy: { name: 'asc' }
        });

        const clientsWithStats = clients.map(client => {
            let hasRenegotiated = false;
            let hasLatePayment = false;
            let totalDebt = 0;
            let totalPaid = 0;

            client.loans.forEach(loan => {
                if (loan.status === 'RENEGOTIATED') {
                    hasRenegotiated = true;
                }

                loan.installments.forEach(inst => {
                    if (inst.status === 'PENDING') {
                        totalDebt += Number(inst.amount);
                        if (new Date(inst.dueDate) < new Date()) {
                            hasLatePayment = true;
                        }
                    } else if (inst.status === 'PAID' || inst.status === 'INTEREST_PAID') {
                        totalPaid += Number(inst.paidAmount);
                    }
                });
            });

            return {
                ...client,
                hasRenegotiated,
                hasLatePayment,
                totalDebt,
                totalPaid
            };
        });

        res.json(clientsWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

app.post('/clients', authenticateToken, async (req, res) => {
    try {
        const { name, whatsapp, cpf, rg, address, motherName, pix, bank, observation, rating, group } = req.body;

        const client = await prisma.client.create({
            data: {
                userId: req.user.id,
                name,
                whatsapp: whatsapp || null,
                cpf: cpf || null,
                rg: rg || null,
                address: address || null,
                motherName: motherName || null,
                pix: pix || null,
                bank: bank || null,
                observation: observation || null,
                group: group || null,
                rating: rating || 5
            }
        });
        res.json(client);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'CPF já cadastrado.' });
        }
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
});

app.put('/clients/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, whatsapp, cpf, rg, address, motherName, pix, bank, observation, rating, group } = req.body;

        // Garante que o cliente pertence ao usuário logado
        const existing = await prisma.client.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });

        const client = await prisma.client.update({
            where: { id },
            data: {
                name,
                whatsapp: whatsapp || null,
                cpf: cpf || null,
                rg: rg || null,
                address: address || null,
                motherName: motherName || null,
                pix: pix || null,
                bank: bank || null,
                observation: observation || null,
                group: group || null,
                rating: rating
            }
        });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

app.delete('/clients/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Garante que o cliente pertence ao usuário logado
        const existing = await prisma.client.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });

        // A exclusão agora é em cascata pelo banco de dados (onDelete: Cascade no schema)
        // Mas por segurança, o Prisma lida com isso se configurado corretamente.
        // Se não, precisaríamos deletar loans manualmente. Como configuramos onDelete: Cascade no schema,
        // o delete do client deve levar tudo.

        await prisma.client.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
});

app.get('/clients/:id/stats', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await prisma.client.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });

        const loans = await prisma.loan.findMany({
            where: { clientId: id },
            include: { installments: true },
            orderBy: { startDate: 'desc' }
        });

        let totalLoaned = 0;
        let totalDebt = 0;
        let totalPaid = 0;
        let activeLoansCount = 0;
        let totalRenegotiations = 0;
        let totalDelays = 0; // Installments paid late or pending/late

        const history = [];

        loans.forEach(loan => {
            totalLoaned += Number(loan.amount);

            // History: Loan Creation
            history.push({
                date: loan.startDate,
                type: 'LOAN',
                description: `Empréstimo de R$ ${Number(loan.amount).toFixed(2)}`,
                status: loan.status
            });

            if (loan.status === 'RENEGOTIATED') {
                totalRenegotiations++;
                history.push({
                    date: loan.updatedAt, // Approximate date of renegotiation
                    type: 'RENEGOTIATION',
                    description: `Empréstimo renegociado`,
                    status: 'WARNING'
                });
            } else {
                if (loan.status === 'ACTIVE') {
                    const pending = loan.installments.filter(i => i.status === 'PENDING').length;
                    if (pending > 0) activeLoansCount++;
                }
            }

            loan.installments.forEach(inst => {
                if (inst.status === 'PENDING') {
                    if (loan.status !== 'RENEGOTIATED') {
                        totalDebt += Number(inst.amount);
                        if (new Date(inst.dueDate) < new Date()) {
                            totalDelays++;
                            history.push({
                                date: inst.dueDate,
                                type: 'DELAY',
                                description: `Atraso na parcela ${inst.number} (${new Date(inst.dueDate).toLocaleDateString('pt-BR')})`,
                                status: 'BAD'
                            });
                        }
                    }
                } else if (inst.status === 'PAID' || inst.status === 'INTEREST_PAID') {
                    totalPaid += Number(inst.paidAmount);

                    // Check if it was paid late
                    if (inst.paidDate && new Date(inst.paidDate) > new Date(inst.dueDate)) {
                        totalDelays++;
                        history.push({
                            date: inst.paidDate,
                            type: 'LATE_PAYMENT',
                            description: `Pagamento com atraso da parcela ${inst.number}`,
                            status: 'WARNING'
                        });
                    } else {
                        history.push({
                            date: inst.paidDate || inst.updatedAt,
                            type: 'PAYMENT',
                            description: `Pagamento da parcela ${inst.number}`,
                            status: 'GOOD'
                        });
                    }
                }
            });
        });

        // Sort history by date descending
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Simple Score Calculation (0 - 100)
        // Base 100
        // -5 per delay
        // -10 per renegotiation
        // +1 per on-time payment (max +20 bonus)

        let score = 100;
        score -= (totalDelays * 5);
        score -= (totalRenegotiations * 10);

        if (score < 0) score = 0;
        if (score > 100) score = 100;

        res.json({
            totalLoaned,
            totalDebt,
            totalPaid,
            activeLoansCount,
            totalRenegotiations,
            totalDelays,
            score,
            history
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas do cliente' });
    }
});

app.post('/clients/:id/documents', authenticateToken, upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

        const document = await prisma.clientDocument.create({
            data: {
                clientId: id,
                name: name || req.file.originalname,
                url: `/uploads/${req.file.filename}`,
                type: req.file.mimetype
            }
        });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar documento' });
    }
});

app.delete('/documents/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const document = await prisma.clientDocument.findUnique({
            where: { id },
            include: { client: true }
        });

        if (!document) return res.status(404).json({ error: 'Documento não encontrado' });
        if (document.client.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        // Remover arquivo físico
        const filePath = path.join(__dirname, 'uploads', path.basename(document.url));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await prisma.clientDocument.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir documento' });
    }
});

// --- ROTAS DE EMPRÉSTIMOS ---

// --- ROTAS DE PARCEIROS ---

app.get('/partners', authenticateToken, async (req, res) => {
    try {
        const partners = await prisma.partner.findMany({
            where: { userId: req.user.id },
            orderBy: { name: 'asc' }
        });
        res.json(partners);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar parceiros' });
    }
});

app.post('/partners', authenticateToken, async (req, res) => {
    const { name, pixKey, commissionRate } = req.body;
    try {
        const partner = await prisma.partner.create({
            data: {
                userId: req.user.id,
                name,
                pixKey,
                commissionRate: commissionRate || 0
            }
        });
        res.json(partner);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar parceiro' });
    }
});

app.delete('/partners/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const partner = await prisma.partner.findFirst({ where: { id, userId: req.user.id } });
        if (!partner) return res.status(404).json({ error: 'Parceiro não encontrado' });

        await prisma.partner.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir parceiro' });
    }
});

// --- ROTAS DE EMPRÉSTIMOS ---

app.get('/loans', authenticateToken, async (req, res) => {
    try {
        const loans = await prisma.loan.findMany({
            where: {
                client: {
                    userId: req.user.id
                }
            },
            include: {
                client: true,
                partner: true,
                installments: {
                    orderBy: { dueDate: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar empréstimos' });
    }
});

app.post('/loans', authenticateToken, async (req, res) => {
    const { clientId, partnerId, amount, totalAmount, installmentsCount, startDate, interestType } = req.body; // Added interestType

    try {
        const client = await prisma.client.findFirst({ where: { id: clientId, userId: req.user.id } });
        if (!client) return res.status(403).json({ error: 'Cliente inválido' });

        const principal = parseFloat(amount);
        const total = parseFloat(totalAmount);
        const totalInterest = total - principal;
        const interestRate = principal > 0 ? (totalInterest / principal) * 100 : 0;
        const installmentValue = total / installmentsCount;

        const result = await prisma.$transaction(async (tx) => {
            const loan = await tx.loan.create({
                data: {
                    clientId,
                    partnerId: partnerId || null,
                    amount: principal,
                    interestType: interestType || 'MONTHLY',
                    interestRate: interestRate,
                    totalAmount: total,
                    startDate: new Date(startDate),
                    installments: {
                        create: Array.from({ length: installmentsCount }).map((_, index) => ({
                            number: index + 1,
                            amount: installmentValue,

                            dueDate: interestType === 'WEEKLY'
                                ? addWeeks(new Date(startDate), index + 1)
                                : interestType === 'DAILY'
                                    ? addDays(new Date(startDate), index + 1)
                                    : addMonths(new Date(startDate), index + 1),
                            status: 'PENDING'
                        }))
                    }
                },
                include: { installments: true }
            });

            // Registrar Saída do Empréstimo
            await tx.transaction.create({
                data: {
                    userId: req.user.id,
                    type: 'OUT',
                    description: `Empréstimo para ${client.name}`,
                    amount: principal,
                    category: 'Empréstimo',
                    date: new Date()
                }
            });

            // Se tiver parceiro, registrar comissão (se houver regra de comissão imediata, 
            // aqui assumimos que o usuário registra a saída da comissão manualmente ou podemos automatizar.
            // Vamos automatizar se o parceiro tiver taxa definida).
            if (partnerId) {
                const partner = await tx.partner.findUnique({ where: { id: partnerId } });
                if (partner && Number(partner.commissionRate) > 0) {
                    // Comissão baseada no lucro (juros) ou no total? Geralmente lucro.
                    // Vou assumir uma regra simples: % sobre o lucro (total - principal).
                    const profit = total - principal;
                    const commission = profit * (Number(partner.commissionRate) / 100);

                    if (commission > 0) {
                        await tx.transaction.create({
                            data: {
                                userId: req.user.id,
                                type: 'OUT',
                                description: `Comissão ${partner.name} - ${client.name}`,
                                amount: commission,
                                category: 'Comissão',
                                date: new Date()
                            }
                        });
                    }
                }
            }

            return loan;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar empréstimo' });
    }
});

app.post('/loans/:id/renegotiate', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { newTotalAmount, newInstallmentsCount, newStartDate, paidAmountEntry, interestType } = req.body;

    try {

        const oldLoan = await prisma.loan.findUnique({
            where: { id },
            include: { client: true, installments: true }
        });

        if (!oldLoan) return res.status(404).json({ error: 'Empréstimo não encontrado' });
        if (oldLoan.client.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        const result = await prisma.$transaction(async (tx) => {
            // 1. Marcar empréstimo antigo como RENEGOTIATED
            await tx.loan.update({
                where: { id },
                data: { status: 'RENEGOTIATED' }
            });

            // 2. Marcar parcelas pendentes como RENEGOTIATED para não contar como atraso
            await tx.installment.updateMany({
                where: {
                    loanId: id,
                    status: 'PENDING'
                },
                data: { status: 'RENEGOTIATED' }
            });

            // 2. Marcar parcelas pendentes como CANCELLED (ou similar, aqui vamos deixar como estão ou deletar? 
            // Melhor manter histórico, mas com status alterado para não somar dívida).
            // Vamos assumir que o status RENEGOTIATED no Loan já invalida a soma das parcelas nos dashboards.

            // 3. Criar novo empréstimo
            // O "Principal" do novo empréstimo é o saldo devedor do antigo? 
            // Simplificação: O usuário define o "Novo Total a Pagar". O "Principal" é considerado o saldo devedor anterior.

            // Calcular saldo devedor do antigo (Soma das parcelas pendentes)
            const debt = oldLoan.installments
                .filter(i => i.status === 'PENDING')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            // Se houve uma "Entrada" na renegociação (ex: cliente pagou 100 reais para renegociar)
            const entry = paidAmountEntry ? parseFloat(paidAmountEntry) : 0;
            const newPrincipal = debt - entry;

            const newInstallmentValue = parseFloat(newTotalAmount) / parseInt(newInstallmentsCount);

            const newLoan = await tx.loan.create({
                data: {
                    clientId: oldLoan.clientId,
                    originalLoanId: oldLoan.id,
                    amount: newPrincipal, // O valor "refinanciado"
                    totalAmount: parseFloat(newTotalAmount),
                    interestRate: 0, // Recalcular se necessário
                    startDate: new Date(newStartDate),
                    status: 'ACTIVE',
                    interestType: interestType || 'MONTHLY',
                    installments: {
                        create: Array.from({ length: parseInt(newInstallmentsCount) }).map((_, index) => ({
                            number: index + 1,
                            amount: newInstallmentValue,

                            dueDate: interestType === 'WEEKLY'
                                ? addWeeks(new Date(newStartDate), index + 1)
                                : interestType === 'DAILY'
                                    ? addDays(new Date(newStartDate), index + 1)
                                    : addMonths(new Date(newStartDate), index + 1),
                            status: 'PENDING'
                        }))
                    }
                }
            });

            // 4. Registrar Entrada no Caixa (se houve pagamento na renegociação)
            if (entry > 0) {
                await tx.transaction.create({
                    data: {
                        userId: req.user.id,
                        type: 'IN',
                        description: `Entrada Renegociação - ${oldLoan.client.name}`,
                        amount: entry,
                        category: 'Renegociação',
                        date: new Date()
                    }
                });
            }

            return newLoan;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao renegociar empréstimo' });
    }
});

app.put('/loans/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { totalAmount, startDate, partnerId } = req.body;
    try {
        const loan = await prisma.loan.findUnique({
            where: { id },
            include: { client: true }
        });

        if (!loan) return res.status(404).json({ error: 'Empréstimo não encontrado' });
        if (loan.client.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        const updated = await prisma.loan.update({
            where: { id },
            data: {
                totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                partnerId: partnerId || null
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar empréstimo' });
    }
});

app.delete('/loans/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const loan = await prisma.loan.findUnique({
            where: { id },
            include: { client: true }
        });

        if (!loan) return res.status(404).json({ error: 'Empréstimo não encontrado' });
        if (loan.client.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        // Delete cascade já configurado no schema para installments
        // Mas precisamos limpar as Transações financeiras geradas por este empréstimo para limpar o dashboard
        // As transações são geradas com descrições específicas. Vamos tentar limpar as mais óbvias.

        // 1. Transações de "Empréstimo Concedido"
        await prisma.transaction.deleteMany({
            where: {
                userId: req.user.id,
                description: { contains: loan.client.name }, // Remove transações ligadas ao nome do cliente
                // Isso é um pouco agressivo, mas atende ao pedido de "limpar dados" quando exclui.
                // Idealmente teríamos um loanId na Transaction.
            }
        });

        await prisma.loan.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir empréstimo' });
    }
});

// --- ROTAS DE PARCELAS E PAGAMENTOS ---

app.post('/installments/:id/pay', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { amountPaid, paymentDate, type, nextDueDate } = req.body;

    try {
        const installment = await prisma.installment.findUnique({
            where: { id },
            include: { loan: { include: { client: true } } }
        });

        if (!installment) return res.status(404).json({ error: 'Parcela não encontrada' });
        if (installment.loan.client.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        let status = 'PAID';
        let description = `Pagamento Parcela ${installment.number} - ${installment.loan.client.name}`;

        await prisma.$transaction(async (tx) => {
            if (type === 'INTEREST_ONLY') {
                status = 'INTEREST_PAID';
                description += ' (Apenas Juros)';

                const lastInstallment = await tx.installment.findFirst({
                    where: { loanId: installment.loanId },
                    orderBy: { number: 'desc' }
                });

                const newNumber = (lastInstallment?.number || installment.number) + 1;
                const newDate = nextDueDate ? new Date(nextDueDate) : addMonths(new Date(installment.dueDate), 1);

                await tx.installment.create({
                    data: {
                        loanId: installment.loanId,
                        number: newNumber,
                        amount: installment.amount,
                        dueDate: newDate,
                        status: 'PENDING'
                    }
                });
            }

            await tx.installment.update({
                where: { id },
                data: {
                    status: status,
                    paidAmount: parseFloat(amountPaid),
                    paidDate: new Date(paymentDate || new Date())
                }
            });

            await tx.transaction.create({
                data: {
                    userId: req.user.id,
                    type: 'IN',
                    description: description,
                    amount: parseFloat(amountPaid),
                    category: type === 'INTEREST_ONLY' ? 'Juros' : 'Pagamento Parcela',
                    date: new Date(paymentDate || new Date())
                }
            });

            // Verificar se todas as parcelas foram pagas para finalizar o empréstimo
            const pendingInstallments = await tx.installment.count({
                where: {
                    loanId: installment.loanId,
                    status: 'PENDING'
                }
            });

            if (pendingInstallments === 0) {
                await tx.loan.update({
                    where: { id: installment.loanId },
                    data: { status: 'COMPLETED' }
                });
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
});

app.put('/installments/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, paidAmount, paidDate, dueDate, amount } = req.body;

    try {
        const installment = await prisma.installment.findUnique({
            where: { id },
            include: { loan: { include: { client: true } } }
        });

        if (!installment) return res.status(404).json({ error: 'Parcela não encontrada' });
        if (installment.loan.client.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        const updated = await prisma.installment.update({
            where: { id },
            data: {
                status,
                amount: amount ? parseFloat(amount) : undefined,
                paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
                paidDate: paidDate ? new Date(paidDate) : null,
                dueDate: dueDate ? new Date(dueDate) : undefined
            }
        });

        // Verificar status do empréstimo
        const pending = await prisma.installment.count({
            where: { loanId: installment.loanId, status: 'PENDING' }
        });

        if (pending === 0) {
            await prisma.loan.update({
                where: { id: installment.loanId },
                data: { status: 'COMPLETED' }
            });
        } else {
            // Se houver pendentes (ex: reabriu uma parcela), volta para ACTIVE
            // Mas apenas se não estiver RENEGOTIATED (pois renegociado é um estado final de "cancelamento")
            if (installment.loan.status !== 'RENEGOTIATED') {
                await prisma.loan.update({
                    where: { id: installment.loanId },
                    data: { status: 'ACTIVE' }
                });
            }
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar parcela' });
    }
});

app.post('/installments/:id/duplicate', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const installment = await prisma.installment.findUnique({
            where: { id },
            include: { loan: { include: { client: true } } }
        });

        if (!installment) return res.status(404).json({ error: 'Parcela não encontrada' });
        if (installment.loan.client.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        const result = await prisma.$transaction(async (tx) => {
            const lastInstallment = await tx.installment.findFirst({
                where: { loanId: installment.loanId },
                orderBy: { number: 'desc' }
            });

            const newNumber = (lastInstallment?.number || installment.number) + 1;
            const newDueDate = addMonths(new Date(installment.dueDate), 1);

            const newInstallment = await tx.installment.create({
                data: {
                    loanId: installment.loanId,
                    number: newNumber,
                    amount: installment.amount,
                    dueDate: newDueDate,
                    status: 'PENDING'
                }
            });

            await tx.loan.update({
                where: { id: installment.loanId },
                data: {
                    totalAmount: {
                        increment: installment.amount
                    }
                }
            });

            return newInstallment;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao duplicar parcela' });
    }
});

app.delete('/installments/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const installment = await prisma.installment.findUnique({
            where: { id },
            include: { loan: { include: { client: true } } }
        });

        if (!installment) return res.status(404).json({ error: 'Parcela não encontrada' });
        if (installment.loan.client.userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        await prisma.installment.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir parcela' });
    }
});

// --- DASHBOARD ---

app.get('/dashboard/summary', authenticateToken, async (req, res) => {
    try {
        // Agrega apenas dados do usuário
        const totalInvested = await prisma.loan.aggregate({
            where: {
                client: { userId: req.user.id },
                status: 'ACTIVE'
            },
            _sum: { amount: true }
        });

        const totalReceivable = await prisma.loan.aggregate({
            where: {
                client: { userId: req.user.id },
                status: 'ACTIVE'
            },
            _sum: { totalAmount: true }
        });

        const today = startOfDay(new Date());
        const lateInstallments = await prisma.installment.aggregate({
            where: {
                loan: {
                    client: { userId: req.user.id },
                    status: 'ACTIVE' // Apenas empréstimos ativos contam como atraso
                },
                status: 'PENDING',
                dueDate: { lt: today }
            },
            _sum: { amount: true }
        });

        const totalReceived = await prisma.installment.aggregate({
            where: {
                loan: { client: { userId: req.user.id } },
                status: { in: ['PAID', 'INTEREST_PAID'] }
            },
            _sum: { paidAmount: true }
        });

        res.json({
            totalInvested: totalInvested._sum.amount || 0,
            totalReceivable: totalReceivable._sum.totalAmount || 0,
            totalLate: lateInstallments._sum.amount || 0,
            totalReceived: totalReceived._sum.paidAmount || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar resumo' });
    }
});

app.get('/dashboard/alerts', authenticateToken, async (req, res) => {
    try {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        const dueToday = await prisma.installment.findMany({
            where: {
                loan: {
                    client: { userId: req.user.id },
                    status: 'ACTIVE'
                },
                dueDate: {
                    gte: startOfToday,
                    lte: endOfToday
                },
                status: 'PENDING'
            },
            include: {
                loan: {
                    include: { client: true }
                }
            }
        });

        const late = await prisma.installment.findMany({
            where: {
                loan: {
                    client: { userId: req.user.id },
                    status: 'ACTIVE'
                },
                dueDate: { lt: startOfToday },
                status: 'PENDING'
            },
            include: {
                loan: {
                    include: { client: true }
                }
            }
        });

        res.json({
            dueToday,
            late
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar alertas' });
    }
});

app.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id },
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
});

app.post('/transactions', authenticateToken, async (req, res) => {
    const { type, description, amount, category, date } = req.body;
    try {
        const transaction = await prisma.transaction.create({
            data: {
                userId: req.user.id,
                type,
                description,
                amount: parseFloat(amount),
                category,
                date: new Date(date || new Date())
            }
        });
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar transação' });
    }
});

app.delete('/transactions/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId: req.user.id }
        });

        if (!transaction) return res.status(404).json({ error: 'Transação não encontrada' });

        await prisma.transaction.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir transação' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
