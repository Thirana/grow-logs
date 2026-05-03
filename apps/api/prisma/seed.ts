import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'] as string,
});
const prisma = new PrismaClient({ adapter });

const flags = [
  { key: 'ai_weekly_summary', description: 'AI-generated weekly digest email' },
  { key: 'github_integration', description: 'GitHub commit and PR auto-import' },
  { key: 'jira_integration', description: 'Jira ticket auto-import' },
  { key: 'stripe_billing', description: 'Stripe subscription billing' },
  { key: 'public_profile', description: 'Shareable public learning profile' },
  { key: 'resume_export', description: 'PDF resume and performance review export' },
];

async function main(): Promise<void> {
  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: { key: flag.key, description: flag.description, enabled: false },
    });
  }
  console.log('Seeded feature flags.');
}

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
