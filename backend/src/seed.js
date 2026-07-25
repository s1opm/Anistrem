import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anistrem';

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, enum: ['superadmin', 'admin', 'editor'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true },
  icon: { type: String },
  color: { type: String, default: '#7c3aed' },
  thumbnail: { type: String },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  videoCount: { type: Number, default: 0 },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

const siteSettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'AniStrem' },
  siteDescription: { type: String, default: 'Premium animation streaming platform' },
  logo: { type: String },
  favicon: { type: String },
  contactEmail: { type: String },
  socialLinks: {
    youtube: String, twitter: String, facebook: String,
    instagram: String, discord: String,
  },
  adSlots: {
    header: String, sidebar: String, videoBelow: String,
    footer: String, betweenVideos: String,
  },
  adSensePublisherId: String,
  adSenseEnabled: { type: Boolean, default: false },
  primaryColor: { type: String, default: '#7c3aed' },
  accentColor: { type: String, default: '#22d3ee' },
  maintenanceMode: { type: Boolean, default: false },
  allowRegistration: { type: Boolean, default: false },
  featuredCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  defaultThumbnail: String,
  seo: {
    metaTitle: String,
    metaDescription: String,
    ogImage: String,
  },
}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

const DEFAULT_CATEGORIES = [
  { name: 'Action', slug: 'action', description: 'High-energy animations with intense combat and battles', icon: '⚔️', iconColor: '#ef4444', order: 1 },
  { name: 'Adventure', slug: 'adventure', description: 'Epic journeys and explorations in animated worlds', icon: '🗺️', iconColor: '#f59e0b', order: 2 },
  { name: 'Comedy', slug: 'comedy', description: 'Humorous and entertaining animations to make you laugh', icon: '😂', iconColor: '#22c55e', order: 3 },
  { name: 'Drama', slug: 'drama', description: 'Emotionally rich storytelling with complex characters', icon: '🎭', iconColor: '#8b5cf6', order: 4 },
  { name: 'Fantasy', slug: 'fantasy', description: 'Magical worlds filled with mythical creatures and spells', icon: '🧙', iconColor: '#a855f7', order: 5 },
  { name: 'Sci-Fi', slug: 'sci-fi', description: 'Futuristic worlds with advanced technology and space exploration', icon: '🚀', iconColor: '#3b82f6', order: 6 },
  { name: 'Horror', slug: 'horror', description: 'Dark and terrifying animations to keep you on the edge', icon: '👻', iconColor: '#dc2626', order: 7 },
  { name: 'Slice of Life', slug: 'slice-of-life', description: 'Heartwarming everyday stories and relatable moments', icon: '🌸', iconColor: '#ec4899', order: 8 },
  { name: 'Romance', slug: 'romance', description: 'Love stories and heartfelt relationships', icon: '💕', iconColor: '#f43f5e', order: 9 },
  { name: 'Mecha', slug: 'mecha', description: 'Giant robots and epic mechanical battles', icon: '🤖', iconColor: '#06b6d4', order: 10 },
  { name: 'Mystery', slug: 'mystery', description: 'Puzzling cases and suspenseful investigations', icon: '🔍', iconColor: '#6366f1', order: 11 },
  { name: 'Sports', slug: 'sports', description: 'Athletic competitions and team spirit', icon: '⚽', iconColor: '#10b981', order: 12 },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@anistrem.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      admin = await Admin.create({
        name: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
      });
      console.log(`✅ Admin created: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log(`ℹ️  Admin already exists: ${adminEmail}`);
    }

    // Categories
    const existingCount = await Category.countDocuments();
    if (existingCount === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log(`✅ ${DEFAULT_CATEGORIES.length} categories created`);
    } else {
      console.log(`ℹ️  ${existingCount} categories already exist`);
    }

    // Site Settings
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({
        siteName: 'AniStrem',
        siteDescription: 'Premium animation streaming platform',
        contactEmail: 'admin@anistrem.com',
        primaryColor: '#7c3aed',
        accentColor: '#22d3ee',
        maintenanceMode: false,
        seo: {
          metaTitle: 'AniStrem - Premium Anime Streaming Platform',
          metaDescription: 'Watch the best animated series and movies. Premium quality streaming with multiple resolutions.',
        },
      });
      console.log('✅ Site settings initialized');
    } else {
      console.log('ℹ️  Site settings already exist');
    }

    console.log('\n🎉 Seed complete!');
    console.log('\n📋 Login Credentials:');
    console.log(`   URL:      ${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  Change the default password after first login!');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure MongoDB is running on', MONGODB_URI);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();