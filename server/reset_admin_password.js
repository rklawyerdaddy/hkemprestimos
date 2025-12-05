const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        const hashedPassword = await bcrypt.hash('admin', 10);

        const user = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                active: true
            },
            create: {
                username: 'admin',
                password: hashedPassword,
                name: 'Administrador',
                role: 'ADMIN',
                active: true
            }
        });

        console.log('Admin user reset successfully:', user);
    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
