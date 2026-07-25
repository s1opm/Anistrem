import bcrypt from 'bcryptjs';
import prisma from './db/index.js';

const ADMIN_EMAIL = 'admin@anistrem.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'Admin';
const ADMIN_ROLE = 'super_admin';

const DEFAULT_CATEGORIES = [
  { name: 'Action', slug: 'action', icon: '🔥', gradient: 'from-red-500 to-orange-500', order: 1, showOnHomepage: true, isFeatured: true },
  { name: 'Romance', slug: 'romance', icon: '💕', gradient: 'from-pink-500 to-rose-500', order: 2, showOnHomepage: true, isFeatured: true },
  { name: 'Comedy', slug: 'comedy', icon: '😂', gradient: 'from-yellow-400 to-amber-500', order: 3, showOnHomepage: true, isFeatured: true },
  { name: 'Drama', slug: 'drama', icon: '🎭', gradient: 'from-purple-500 to-violet-500', order: 4, showOnHomepage: true, isFeatured: true },
  { name: 'Fantasy', slug: 'fantasy', icon: '✨', gradient: 'from-blue-500 to-indigo-500', order: 5, showOnHomepage: true, isFeatured: true },
  { name: 'Sci-Fi', slug: 'sci-fi', icon: '🚀', gradient: 'from-cyan-500 to-teal-500', order: 6, showOnHomepage: true, isFeatured: true },
  { name: 'Horror', slug: 'horror', icon: '👻', gradient: 'from-gray-700 to-gray-900', order: 7, showOnHomepage: true, isFeatured: false },
  { name: 'Slice of Life', slug: 'slice-of-life', icon: '🌸', gradient: 'from-pink-300 to-rose-300', order: 8, showOnHomepage: true, isFeatured: false },
  { name: 'Sports', slug: 'sports', icon: '⚽', gradient: 'from-green-500 to-emerald-500', order: 9, showOnHomepage: false, isFeatured: false },
  { name: 'Mystery', slug: 'mystery', icon: '🔍', gradient: 'from-indigo-600 to-blue-800', order: 10, showOnHomepage: false, isFeatured: false },
  { name: 'Mecha', slug: 'mecha', icon: '🤖', gradient: 'from-slate-500 to-zinc-700', order: 11, showOnHomepage: false, isFeatured: false },
  { name: 'Music', slug: 'music', icon: '🎵', gradient: 'from-violet-400 to-purple-500', order: 12, showOnHomepage: false, isFeatured: false },
  { name: 'Historical', slug: 'historical', icon: '🏯', gradient: 'from-amber-700 to-yellow-800', order: 13, showOnHomepage: false, isFeatured: false },
  { name: 'Martial Arts', slug: 'martial-arts', icon: '🥋', gradient: 'from-red-700 to-red-900', order: 14, showOnHomepage: false, isFeatured: false },
  { name: 'Adventure', slug: 'adventure', icon: '🗺️', gradient: 'from-teal-400 to-cyan-600', order: 15, showOnHomepage: true, isFeatured: true },
];

export async function seedAdmin() {
  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    } else {
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
    }

    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          isActive: true,
        })),
      });
      console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);
    } else {
      console.log(`Categories already exist (${categoryCount} found)`);
    }
  } catch (error) {
    console.error('Seed error:', error.message);
  }
}
