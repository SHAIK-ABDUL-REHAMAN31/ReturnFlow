import { connectDB, disconnectDB } from '../config/db.js';
import { demoService } from '../modules/demo/demo.service.js';
import { logger } from '../lib/logger.js';

async function seed() {
  try {
    await connectDB();
    logger.info('Connecting to MongoDB and reseeding demo data...');
    const summary = await demoService.reseedData();
    logger.info({ summary }, 'Demo data successfully seeded into MongoDB!');
    await disconnectDB();
    console.log('\n\x1b[32m✔ Demo database seeded successfully!\x1b[0m');
    console.log('  - Merchant: merchant@returnflow.io (Password: Password123!)');
    console.log('  - Customer: customer@example.com (Password: Password123!)');
    console.log('  - Orders: ORD-9021, ORD-9022, ORD-9023, ORD-9024, ORD-9025');
    console.log('  - Returns in every lifecycle status populated.\n');
    process.exit(0);
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to seed database');
    process.exit(1);
  }
}

seed();
