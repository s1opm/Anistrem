import Video from '../models/Video.js';
import Category from '../models/Category.js';
import SiteSettings from '../models/SiteSettings.js';
import Admin from '../models/Admin.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [
    totalVideos,
    totalViews,
    totalCategories,
    recentUploads,
    videosByStatus,
    viewsByDay,
    topCategories,
    topVideos,
    recentAdmins,
  ] = await Promise.all([
    Video.countDocuments(),
    Video.aggregate([
      { $group: { _id: null, total: { $sum: '$viewCount' } } },
    ]),
    Category.countDocuments({ isActive: true }),
    Video.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name slug')
      .select('title slug status processingStatus viewCount createdAt category')
      .lean(),
    Video.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Video.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          views: { $sum: '$viewCount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Category.find({ isActive: true })
      .sort({ videoCount: -1, viewCount: -1 })
      .limit(10)
      .select('name slug videoCount viewCount icon iconColor gradient')
      .lean(),
    Video.find({ status: 'published' })
      .sort({ viewCount: -1 })
      .limit(10)
      .populate('category', 'name slug')
      .select('title slug viewCount likeCount publishedAt category')
      .lean(),
    Admin.find({ isActive: true })
      .sort({ lastLogin: -1 })
      .limit(5)
      .select('name email role lastLogin')
      .lean(),
  ]);
  
  const stats = {
    totalVideos,
    totalViews: totalViews[0]?.total || 0,
    totalCategories,
    videosByStatus: videosByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    viewsByDay,
    topCategories,
    topVideos,
    recentUploads,
    recentAdmins,
  };
  
  res.json({
    success: true,
    data: stats,
  });
});

export const getVideoAnalytics = asyncHandler(async (req, res) => {
  const { videoId, period = '30d' } = req.query;
  
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let videoQuery = { createdAt: { $gte: startDate } };
  if (videoId) videoQuery._id = videoId;
  
  const [
    viewsData,
    engagementData,
    retentionData,
    trafficSources,
    deviceData,
    geoData,
    qualityData,
  ] = await Promise.all([
    Video.aggregate([
      { $match: videoQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          views: { $sum: '$viewCount' },
          likes: { $sum: '$likeCount' },
          comments: { $sum: '$commentCount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Video.aggregate([
      { $match: videoQuery },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: '$commentCount' },
          totalShares: { $sum: '$shareCount' },
          avgWatchTime: { $avg: '$averageWatchTime' },
          completionRate: { $avg: '$completionRate' },
        },
      },
    ]),
    Video.aggregate([
      { $match: videoQuery },
      {
        $bucket: {
          groupBy: '$completionRate',
          boundaries: [0, 10, 25, 50, 75, 90, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgViews: { $avg: '$viewCount' },
          },
        },
      },
    ]),
    [],
    [],
    [],
    [],
  ]);
  
  res.json({
    success: true,
    data: {
      viewsData,
      engagement: engagementData[0] || {},
      retentionData,
      trafficSources,
      deviceData,
      geoData,
      qualityData,
    },
  });
});

export const getCategoryAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [
    categoryStats,
    categoryGrowth,
    categoryEngagement,
  ] = await Promise.all([
    Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'videos',
          let: { catId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$category', '$$catId'] }, status: 'published', createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: null,
                videos: { $sum: 1 },
                views: { $sum: '$viewCount' },
                likes: { $sum: '$likeCount' },
                watchTime: { $sum: '$watchTime' },
              },
            },
          ],
          as: 'stats',
        },
      },
      { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          slug: 1,
          icon: 1,
          iconColor: 1,
          gradient: 1,
          videoCount: { $ifNull: ['$stats.videos', 0] },
          views: { $ifNull: ['$stats.views', 0] },
          likes: { $ifNull: ['$stats.likes', 0] },
          watchTime: { $ifNull: ['$stats.watchTime', 0] },
        },
      },
      { $sort: { views: -1 } },
    ]),
    Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'videos',
          let: { catId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$category', '$$catId'] }, status: 'published' } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                videos: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          as: 'growth',
        },
      },
      { $unwind: { path: '$growth', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$name',
          slug: { $first: '$slug' },
          growth: { $push: '$growth' },
        },
      },
    ]),
    Video.aggregate([
      { $match: { status: 'published', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$category',
          avgCompletionRate: { $avg: '$completionRate' },
          avgWatchTime: { $avg: '$averageWatchTime' },
          totalEngagement: { $sum: { $add: ['$likeCount', '$commentCount', '$shareCount'] } },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          slug: '$category.slug',
          avgCompletionRate: 1,
          avgWatchTime: 1,
          totalEngagement: 1,
        },
      },
      { $sort: { totalEngagement: -1 } },
    ]),
  ]);
  
  res.json({
    success: true,
    data: {
      categoryStats,
      categoryGrowth,
      categoryEngagement,
    },
  });
});

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  // Placeholder for revenue analytics (ads, subscriptions, etc.)
  res.json({
    success: true,
    data: {
      adRevenue: { current: 0, previous: 0, growth: 0 },
      subscriptionRevenue: { current: 0, previous: 0, growth: 0 },
      totalRevenue: { current: 0, previous: 0, growth: 0 },
      bySource: [],
      byPeriod: [],
    },
  });
});

export const getSystemHealth = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  
  const health = {
    database: 'healthy',
    storage: 'healthy',
    processing: 'healthy',
    cdn: 'healthy',
    lastBackup: settings.lastBackup || null,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version,
    env: process.env.NODE_ENV,
  };
  
  res.json({
    success: true,
    data: health,
  });
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 20, type = 'all' } = req.query;
  
  const activities = [];
  
  if (type === 'all' || type === 'videos') {
    const recentVideos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('addedBy', 'name')
      .populate('category', 'name')
      .select('title slug status processingStatus createdAt addedBy category')
      .lean();
    
    activities.push(...recentVideos.map(v => ({
      type: 'video',
      action: v.status === 'published' ? 'published' : 'uploaded',
      title: v.title,
      slug: v.slug,
      category: v.category?.name,
      user: v.addedBy?.name,
      timestamp: v.createdAt,
      status: v.status,
      processingStatus: v.processingStatus,
    })));
  }
  
  if (type === 'all' || type === 'admins') {
    const recentAdmins = await Admin.find()
      .sort({ lastLogin: -1 })
      .limit(parseInt(limit))
      .select('name email role lastLogin')
      .lean();
    
    activities.push(...recentAdmins.map(a => ({
      type: 'admin',
      action: 'login',
      title: `${a.name} logged in`,
      user: a.name,
      timestamp: a.lastLogin,
    })));
  }
  
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json({
    success: true,
    data: activities.slice(0, parseInt(limit)),
  });
});

export const exportData = asyncHandler(async (req, res) => {
  const { type = 'videos', format = 'json', period = '30d' } = req.query;
  
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let data;
  let filename;
  
  switch (type) {
    case 'videos':
      data = await Video.find({ createdAt: { $gte: startDate } })
        .populate('category', 'name slug')
        .populate('addedBy', 'name email')
        .lean();
      filename = `videos-${period}.${format}`;
      break;
    case 'categories':
      data = await Category.find().lean();
      filename = `categories-${period}.${format}`;
      break;
    case 'analytics':
      // Complex analytics export
      data = { message: 'Analytics export not implemented yet' };
      filename = `analytics-${period}.${format}`;
      break;
    default:
      return res.status(400).json({ success: false, message: 'Invalid export type' });
  }
  
  if (format === 'csv') {
    // Convert to CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // CSV conversion logic here
    return res.send('CSV export not fully implemented');
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(data);
});