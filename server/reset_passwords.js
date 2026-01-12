require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const defaultPassword = '456123a';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const usersToReset = ['admin', 'hkemprestimos'];

    console.log(`Resetting passwords to: ${defaultPassword}`);

    for (const username of usersToReset) {
        try {
            const user = await prisma.user.findUnique({ where: { username } });

            if (user) {
                await prisma.user.update({
                    where: { username },
                    data: {
                        password: hashedPassword,
                        active: true // Garantir que está ativo
                    }
                });
                console.log(`[OK] Senha resetada para o usuário: ${username}`);
            } else {
                console.log(`[!] Usuário não encontrado: ${username}`);
            }
        } catch (error) {
            console.error(`[ERRO] Falha ao resetar ${username}:`, error.message);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
