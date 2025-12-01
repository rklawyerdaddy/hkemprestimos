const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecionando Parcelas Pagas ---');

    const paidInstallments = await prisma.installment.findMany({
        where: {
            status: { in: ['PAID', 'INTEREST_PAID'] }
        },
        include: {
            loan: {
                include: {
                    client: true
                }
            }
        }
    });

    console.log(`Encontradas ${paidInstallments.length} parcelas pagas.`);

    let calculatedTotal = 0;

    paidInstallments.forEach(inst => {
        console.log(`ID: ${inst.id.split('-')[0]}... | Cliente: ${inst.loan.client.name} | Status: ${inst.status} | Valor: ${inst.amount} | Pago: ${inst.paidAmount} | Data: ${inst.paidDate}`);
        calculatedTotal += Number(inst.paidAmount || 0);
    });

    console.log('---');
    console.log(`Total Calculado via Script (Soma de paidAmount): ${calculatedTotal}`);

    const agg = await prisma.installment.aggregate({
        _sum: { paidAmount: true }
    });
    console.log(`Total via Aggregate (Prisma): ${agg._sum.paidAmount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
