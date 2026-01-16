import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Diagnostics: Checking SiteSettings...');

    const settings = await prisma.siteSettings.findFirst();

    if (!settings) {
        console.log('❌ No settings found in database.');
        return;
    }

    console.log(`📊 Current State: enableEarlyAccess = ${settings.enableEarlyAccess}`);

    if (settings.enableEarlyAccess) {
        console.log('✅ Feature is already ENABLED in database.');
    } else {
        console.log('⚠️ Feature is DISABLED. Attempting to force enable...');
        try {
            const updated = await prisma.siteSettings.update({
                where: { id: settings.id },
                data: { enableEarlyAccess: true }
            });
            console.log(`✅ Success! New State: enableEarlyAccess = ${updated.enableEarlyAccess}`);
        } catch (error) {
            console.error('❌ Failed to update:', error);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
