const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecionando Parcelas com paidAmount > 0 e Status != PAID/INTEREST_PAID ---');

    const ghostPayments = await prisma.installment.findMany({
        where: {
            paidAmount: { gt: 0 },
            status: { notIn: ['PAID', 'INTEREST_PAID'] }
        },
        include: {
            loan: {
                include: {
                    client: true
                }
            }
        }
    });

    console.log(`Encontradas ${ghostPayments.length} parcelas suspeitas.`);

    ghostPayments.forEach(inst => {
        console.log(`ID: ${inst.id.split('-')[0]}... | Cliente: ${inst.loan.client.name} | Status: ${inst.status} | Valor: ${inst.amount} | Pago: ${inst.paidAmount}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
