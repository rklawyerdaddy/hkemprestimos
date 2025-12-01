const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin', 10);

    try {
        const user = await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                name: 'Administrador'
            }
        });
        console.log('Usuário admin criado:', user);
    } catch (e) {
        console.log('Usuário admin já deve existir ou erro:', e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
