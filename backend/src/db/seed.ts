import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

// Load .env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

// Dynamically generate the hash using the local bcrypt package
const PASSWORD_HASH = bcrypt.hashSync('password123', 10);

async function seed() {
  console.log('Connecting to PostgreSQL database...');
  const directUrl = databaseUrl!.replace('?pgbouncer=true', '').replace(':6543', ':5432');
  const client = new Client({ connectionString: directUrl });
  await client.connect();

  console.log('Successfully connected.');

  try {
    // 1. Run all SQL migrations first to ensure all tables exist
    console.log('Running SQL migrations...');
    const migrationsDir = path.join(__dirname, '../../supabase/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to maintain correct dependency ordering

    for (const file of migrationFiles) {
      console.log(`Executing migration file: ${file}`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute the migration SQL
      try {
        await client.query(sqlContent);
      } catch (err: any) {
        // Ignore duplicate type errors (like user_role or ledger_entry_type already existing)
        if (err.message.includes('already exists')) {
          // Log and skip
          console.log(`  - Type or table already exists, skipping duplicate creation.`);
        } else {
          throw err;
        }
      }
    }
    console.log('All migrations executed successfully.');

    // 2. Clean up existing data
    console.log('Cleaning up existing data...');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM payouts');
    await client.query('DELETE FROM ledger_entries');
    await client.query('DELETE FROM disputes');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM services');
    await client.query('DELETE FROM freelancer_profiles');
    await client.query('DELETE FROM users');

    console.log('Existing tables cleared.');

    // 3. Create Admin
    console.log('Creating Admin User...');
    const adminRes = await client.query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ('admin@yopmail.com', $1, 'System Admin', 'admin') RETURNING id`,
      [PASSWORD_HASH]
    );
    const adminId = adminRes.rows[0].id;

    // 4. Create Support Agent
    console.log('Creating Support Agent...');
    const supportRes = await client.query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ('support@yopmail.com', $1, 'Senior Support', 'support') RETURNING id`,
      [PASSWORD_HASH]
    );
    const supportId = supportRes.rows[0].id;

    // 5. Create 15 Customer Users
    console.log('Creating 15 Customer Users...');
    const customerIds: string[] = [];
    for (let i = 1; i <= 15; i++) {
      const custRes = await client.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, 'customer') RETURNING id`,
        [`customer${i}@yopmail.com`, PASSWORD_HASH, `Customer User ${i}`]
      );
      customerIds.push(custRes.rows[0].id);
    }

    // 6. Create 15 Freelancer Users
    console.log('Creating 15 Freelancer Users...');
    const freelancerUserIds: string[] = [];
    for (let i = 1; i <= 15; i++) {
      const freeRes = await client.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, 'freelancer') RETURNING id`,
        [`freelancer${i}@yopmail.com`, PASSWORD_HASH, `Freelancer ${i}`]
      );
      freelancerUserIds.push(freeRes.rows[0].id);
    }

    // 7. Create Freelancer Profiles
    console.log('Creating Freelancer Profiles...');
    const categories = [
      'Software Development',
      'Graphic Design & Branding',
      'SEO & Content Strategy',
      'Video Editing & Animation',
      'Digital Marketing'
    ];

    const freelancerProfileIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const category = categories[i % categories.length];
      const bio = `Hello, I am Freelancer ${i + 1}. I specialize in ${category} with over 4 years of professional agency experience. Ready to deliver high-quality work.`;
      
      const profileRes = await client.query(
        `INSERT INTO freelancer_profiles (user_id, category, bio, rating_avg, commission_tier, razorpay_contact_id, razorpay_fund_account_id, kyc_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          freelancerUserIds[i],
          category,
          bio,
          4.5 + (i % 6) * 0.1, // Rating between 4.5 and 5.0
          15.00 - (i % 3) * 2.5, // Tiers: 15%, 12.5%, 10%
          `cont_test_contact_${i + 1}`,
          `fa_test_fund_${i + 1}`,
          'APPROVED'
        ]
      );
      freelancerProfileIds.push(profileRes.rows[0].id);
    }

    // 8. Create Services (Gigs) for Freelancers
    console.log('Creating Services for Freelancers...');
    const serviceIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const profileId = freelancerProfileIds[i];
      const category = categories[i % categories.length];
      const price = 1000 + i * 250; // Prices ranging from ₹1000 to ₹4500
      
      const serviceRes = await client.query(
        `INSERT INTO services (freelancer_id, title, description, category, price, delivery_days, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
        [
          profileId,
          `Expert ${category} Services - Tier ${i + 1}`,
          `I will provide top-notch ${category} deliverables tailored to your business needs within the delivery window. Unlimited revisions included.`,
          category,
          price,
          3 + (i % 3) // 3 to 5 days
        ]
      );
      serviceIds.push(serviceRes.rows[0].id);
    }

    // 9. Seed Orders with different statuses, Ledgers, Disputes & Reviews
    console.log('Creating Orders, Ledger Entries, Disputes & Reviews...');
    
    // Order 1: Completed Order (Customer 1 -> Freelancer 1)
    const order1Res = await client.query(
      `INSERT INTO orders (service_id, customer_id, freelancer_id, amount, commission_rate, status) 
       VALUES ($1, $2, $3, 1000.00, 15.00, 'completed') RETURNING id`,
      [serviceIds[0], customerIds[0], freelancerUserIds[0]]
    );
    const order1Id = order1Res.rows[0].id;
    
    // Ledger for Order 1
    await client.query(
      `INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount) VALUES 
       ($1, 'customer_deposit', 'razorpay_gateway', 'customer_wallet:${customerIds[0]}', 1000.00),
       ($1, 'escrow_lock', 'customer_wallet:${customerIds[0]}', 'platform_holding:${order1Id}', 1000.00),
       ($1, 'escrow_release', 'platform_holding:${order1Id}', 'freelancer_wallet:${freelancerUserIds[0]}', 850.00),
       ($1, 'platform_commission', 'platform_holding:${order1Id}', 'platform_revenue', 150.00)`,
      [order1Id]
    );

    // Review for Order 1
    await client.query(
      `INSERT INTO reviews (order_id, service_id, freelancer_id, customer_id, rating, comment) 
       VALUES ($1, $2, $3, $4, 5, 'Exceptional deliverables, highly recommend!')`,
      [order1Id, serviceIds[0], freelancerUserIds[0], customerIds[0]]
    );

    // Order 2: Disputed Order (Customer 2 -> Freelancer 2)
    const order2Res = await client.query(
      `INSERT INTO orders (service_id, customer_id, freelancer_id, amount, commission_rate, status) 
       VALUES ($1, $2, $3, 1250.00, 12.50, 'disputed') RETURNING id`,
      [serviceIds[1], customerIds[1], freelancerUserIds[1]]
    );
    const order2Id = order2Res.rows[0].id;

    // Ledger for Order 2 (Only deposited & locked, not released)
    await client.query(
      `INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount) VALUES 
       ($1, 'customer_deposit', 'razorpay_gateway', 'customer_wallet:${customerIds[1]}', 1250.00),
       ($1, 'escrow_lock', 'customer_wallet:${customerIds[1]}', 'platform_holding:${order2Id}', 1250.00)`,
      [order2Id]
    );

    // File Dispute for Order 2
    await client.query(
      `INSERT INTO disputes (order_id, filed_by, reason, status) 
       VALUES ($1, $2, 'The deliverables did not meet specifications, and freelancer was unresponsive.', 'open')`,
      [order2Id, customerIds[1]]
    );

    // Order 3: Payment Captured / Work In Progress (Customer 3 -> Freelancer 3)
    const order3Res = await client.query(
      `INSERT INTO orders (service_id, customer_id, freelancer_id, amount, commission_rate, status) 
       VALUES ($1, $2, $3, 1500.00, 10.00, 'payment_captured') RETURNING id`,
      [serviceIds[2], customerIds[2], freelancerUserIds[2]]
    );
    const order3Id = order3Res.rows[0].id;
    await client.query(
      `INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount) VALUES 
       ($1, 'customer_deposit', 'razorpay_gateway', 'customer_wallet:${customerIds[2]}', 1500.00),
       ($1, 'escrow_lock', 'customer_wallet:${customerIds[2]}', 'platform_holding:${order3Id}', 1500.00)`,
      [order3Id]
    );

    // Order 4: Service Delivered / Awaiting Approval (Customer 4 -> Freelancer 4)
    const order4Res = await client.query(
      `INSERT INTO orders (service_id, customer_id, freelancer_id, amount, commission_rate, status) 
       VALUES ($1, $2, $3, 1750.00, 15.00, 'service_delivered') RETURNING id`,
      [serviceIds[3], customerIds[3], freelancerUserIds[3]]
    );
    const order4Id = order4Res.rows[0].id;
    await client.query(
      `INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount) VALUES 
       ($1, 'customer_deposit', 'razorpay_gateway', 'customer_wallet:${customerIds[3]}', 1750.00),
       ($1, 'escrow_lock', 'customer_wallet:${customerIds[3]}', 'platform_holding:${order4Id}', 1750.00)`,
      [order4Id]
    );

    // 10. Create some Payout Logs (Withdrawal history)
    console.log('Creating Payout/Withdrawal logs...');
    await client.query(
      `INSERT INTO payouts (user_id, amount, payout_id, status) VALUES 
       ($1, 850.00, 'pout_test_payout_1', 'SUCCESS'),
       ($1, 1200.00, 'pout_test_payout_2', 'PENDING')`,
      [freelancerUserIds[0]]
    );

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding encountered an error:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

seed();
