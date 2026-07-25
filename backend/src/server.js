import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { maintenanceCheck } from './middleware/maintenance.js';

import adminRoutes from './routes/adminRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import siteSettingsRoutes from './routes/siteSettingsRoutes.js';
import Admin from './models/Admin.js';
import Category from './models/Category.js';

import './models/Series.js';
import './models/Season.js';
import './models/Playlist.js';
import './models/Comment.js';
import './models/User.js';
import './models/WatchHistory.js';
import './models/Favorite.js';
import './models/VideoView.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

const frontendUrl = config.frontend.url;
const allowedOrigins = config.nodeEnv === 'production'
  ? [frontendUrl]
  : [frontendUrl, 'http://localhost:3000'];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://pagead2.googlesyndication.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      mediaSrc: ["'self'", "blob:", "https:", "http:", "data:"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://www.google.com", "https://pagead2.googlesyndication.com"],
      connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || config.nodeEnv !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
}));

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === 'health',
});

app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too Many Attempts',
    message: 'Too many login attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/admin/login', authLimiter);

app.use(maintenanceCheck);

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: config.nodeEnv === 'production' ? '7d' : '1d',
  etag: true,
  lastModified: true,
}));

const frontendDist = path.join(__dirname, '../../frontend/dist');
const fs = await import('fs').catch(() => null);
const hasFrontendDist = fs && fs.existsSync(frontendDist);

if (hasFrontendDist) {
  app.use(express.static(frontendDist, {
    maxAge: config.nodeEnv === 'production' ? '1h' : '0',
    etag: true,
    lastModified: true,
  }));
}

app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/site-settings', siteSettingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      },
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const { default: SiteSettings } = await import('./models/SiteSettings.js');
    const { default: Video } = await import('./models/Video.js');
    const { default: Category } = await import('./models/Category.js');
    
    const settings = await SiteSettings.getSettings();
    const baseUrl = settings.siteUrl || frontendUrl;
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    sitemap += `  <url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/videos</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/categories</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/trending</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/latest</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/privacy</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>\n`;
    sitemap += `  <url><loc>${baseUrl}/terms</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>\n`;
    
    const videos = await Video.find({ status: 'published', visibility: 'public' }).select('slug updatedAt').lean();
    videos.forEach(video => {
      sitemap += `  <url><loc>${baseUrl}/watch/${video.slug}</loc><lastmod>${video.updatedAt.toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    });
    
    const categories = await Category.find({ isActive: true }).select('slug updatedAt').lean();
    categories.forEach(cat => {
      sitemap += `  <url><loc>${baseUrl}/category/${cat.slug}</loc><lastmod>${cat.updatedAt.toISOString().split('T')[0]}</lastmod><changefreq>daily</changefreq><priority>0.6</priority></url>\n`;
    });
    
    sitemap += '</urlset>';
    
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (req, res) => {
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /dashboard

Sitemap: ${frontendUrl}/sitemap.xml`;
  
  res.set('Content-Type', 'text/plain');
  res.send(content);
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  if (hasFrontendDist) {
    const frontendPath = path.join(frontendDist, 'index.html');
    return res.sendFile(frontendPath, (err) => {
      if (err) {
        res.status(404).json({ success: false, message: 'Not Found' });
      }
    });
  }
  
  res.status(404).json({ success: false, message: 'API only - frontend served separately' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

const autoSeed = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@anistrem.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = await Admin.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
        isActive: true,
      });
      console.log(`Auto-seeded admin: ${adminEmail}`);
    }

    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      const DEFAULT_CATEGORIES = [
        { name: 'Action', slug: 'action', description: 'High-energy animations with intense combat and battles', icon: '⚔️', iconColor: '#ef4444', order: 1 },
        { name: 'Adventure', slug: 'adventure', description: 'Epic journeys and explorations in animated worlds', icon: '🗺️', iconColor: '#f59e0b', order: 2 },
        { name: 'Comedy', slug: 'comedy', description: 'Humorous and entertaining animations', icon: '😂', iconColor: '#22c55e', order: 3 },
        { name: 'Drama', slug: 'drama', description: 'Emotionally rich storytelling', icon: '🎭', iconColor: '#8b5cf6', order: 4 },
        { name: 'Fantasy', slug: 'fantasy', description: 'Magical worlds filled with mythical creatures', icon: '🧙', iconColor: '#a855f7', order: 5 },
        { name: 'Sci-Fi', slug: 'sci-fi', description: 'Futuristic worlds with advanced technology', icon: '🚀', iconColor: '#3b82f6', order: 6 },
        { name: 'Horror', slug: 'horror', description: 'Dark and terrifying animations', icon: '👻', iconColor: '#dc2626', order: 7 },
        { name: 'Slice of Life', slug: 'slice-of-life', description: 'Heartwarming everyday stories', icon: '🌸', iconColor: '#ec4899', order: 8 },
        { name: 'Romance', slug: 'romance', description: 'Love stories and heartfelt relationships', icon: '💕', iconColor: '#f43f5e', order: 9 },
        { name: 'Mecha', slug: 'mecha', description: 'Giant robots and epic mechanical battles', icon: '🤖', iconColor: '#06b6d4', order: 10 },
        { name: 'Mystery', slug: 'mystery', description: 'Puzzling cases and suspenseful investigations', icon: '🔍', iconColor: '#6366f1', order: 11 },
        { name: 'Sports', slug: 'sports', description: 'Athletic competitions and team spirit', icon: '⚽', iconColor: '#10b981', order: 12 },
      ];
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log(`Auto-seeded ${DEFAULT_CATEGORIES.length} categories`);
    }
  } catch (error) {
    console.error('Auto-seed error:', error.message);
  }
};

const startServer = async () => {
  await connectDB();
  
  await autoSeed();
  
  const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   AniStrem Server                                    ║
║                                                      ║
║   Mode: ${config.nodeEnv.padEnd(44)}║
║   Port: ${String(PORT).padEnd(44)}║
║   URL:  ${frontendUrl.padEnd(44)}║
║                                                      ║
╚══════════════════════════════════════════════════════╝
    `);
  });

  process.on('SIGTERM', () => {
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  });
};

startServer().catch(console.error);

export default app;
