import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://abdodfxlhvznfpdrtkzv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const accountsToCreate = [
  {
    email: 'admin@estatebridge.com',
    password: 'Password@123',
    role: 'ADMIN',
    fullName: 'Admin User'
  },
  {
    email: 'employee@estatebridge.com',
    password: 'Password@123',
    role: 'EMPLOYEE',
    fullName: 'Test Employee'
  },
  {
    email: 'dealer@estatebridge.com',
    password: 'Password@123',
    role: 'DEALER',
    fullName: 'Test Dealer'
  },
  {
    email: 'customer@estatebridge.com',
    password: 'Password@123',
    role: 'CUSTOMER',
    fullName: 'Test Customer'
  }
];

async function seedAccounts() {
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error fetching users:', listError);
  } else {
    console.log(`Found ${users.length} existing users.`);
    for (const u of users) {
      console.log(`- ${u.email}`);
    }
  }
}

seedAccounts();
