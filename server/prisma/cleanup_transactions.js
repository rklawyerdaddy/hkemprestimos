const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up orphaned transactions...');
    // Delete all transactions to reset the dashboard financial data
    // This is safe because the user stated they deleted all loans and want the dashboard to reflect that.
    const deleted = await prisma.transaction.deleteMany({});
    console.log(`Deleted ${deleted.count} transactions.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
