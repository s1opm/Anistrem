import bcrypt from 'bcryptjs';
import prisma from './db/index.js';

const ADMIN_EMAIL = 'admin@anistrem.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'Admin';
const ADMIN_ROLE = 'super_admin';

export async function seedAdmin() {
  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await prisma.admin.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        role: ADMIN_ROLE,
        isActive: true,
      },
    });

    console.log(`Admin seeded: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
  }
}
