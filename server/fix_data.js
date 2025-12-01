const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Limpando paidAmount de parcelas PENDING/LATE ---');

    const result = await prisma.installment.updateMany({
        where: {
            status: { notIn: ['PAID', 'INTEREST_PAID'] },
            paidAmount: { gt: 0 }
        },
        data: {
            paidAmount: 0
        }
    });

    console.log(`Atualizadas ${result.count} parcelas.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
