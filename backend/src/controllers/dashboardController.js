import prisma from '../db/index.js';

export async function getDashboardStats(req, res) {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalVideos,
      totalCategories,
      viewsAggregate,
      publishedVideos,
      draftVideos,
      recentVideos,
      topVideos,
      categoryDistribution,
    ] = await Promise.all([
      prisma.video.count(),
      prisma.category.count(),
      prisma.video.aggregate({ _sum: { viewCount: true } }),
      prisma.video.count({ where: { status: 'published' } }),
      prisma.video.count({ where: { status: 'draft' } }),
      prisma.video.findMany({
        where: { createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.video.findMany({
        orderBy: { viewCount: 'desc' },
        take: 5,
        include: { category: true },
      }),
      prisma.category.findMany({
        include: { _count: { select: { videos: true } } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalVideos,
        totalCategories,
        totalViews: viewsAggregate._sum.viewCount || 0,
        publishedVideos,
        draftVideos,
        recentVideos,
        topVideos,
        categoryDistribution,
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
    });
  }
}

export async function getVideoAnalytics(req, res) {
  try {
    const videosByStatus = await prisma.video.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { viewCount: true },
    });

    const totalViews = await prisma.video.aggregate({
      _sum: { viewCount: true },
      _avg: { viewCount: true },
      _max: { viewCount: true },
      _min: { viewCount: true },
    });

    const topPerformingVideos = await prisma.video.findMany({
      orderBy: { viewCount: 'desc' },
      take: 10,
      include: { category: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        videosByStatus,
        views: {
          total: totalViews._sum.viewCount || 0,
          average: totalViews._avg.viewCount || 0,
          max: totalViews._max.viewCount || 0,
          min: totalViews._min.viewCount || 0,
        },
        topPerformingVideos,
      },
    });
  } catch (error) {
    console.error('getVideoAnalytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch video analytics',
    });
  }
}

export async function getCategoryAnalytics(req, res) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { videos: true } },
        videos: {
          select: { viewCount: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        videoCount: cat._count.videos,
        totalViews: cat.videos.reduce((sum, v) => sum + (v.viewCount || 0), 0),
        description: cat.description,
        image: cat.image,
      }))
      .sort((a, b) => b.totalViews - a.totalViews);

    return res.status(200).json({
      success: true,
      data: {
        categories: enriched,
        totalCategories: enriched.length,
      },
    });
  } catch (error) {
    console.error('getCategoryAnalytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category analytics',
    });
  }
}

export async function getRevenueAnalytics(req, res) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueByMonth: [],
        topEarners: [],
        adsRevenue: 0,
        subscriptionRevenue: 0,
      },
    });
  } catch (error) {
    console.error('getRevenueAnalytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
    });
  }
}

export async function getSystemHealth(req, res) {
  try {
    let dbStatus = 'healthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return res.status(200).json({
      success: true,
      data: {
        database: {
          status: dbStatus,
        },
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers,
        },
        uptime: Math.floor(uptime),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (error) {
    console.error('getSystemHealth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
    });
  }
}

export async function getRecentActivity(req, res) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentVideos, recentFavorites, recentViews] = await Promise.all([
      prisma.video.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.favorite.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
            },
          },
        },
      }),
      prisma.videoView.findMany({
        where: { viewedAt: { gte: thirtyDaysAgo } },
        orderBy: { viewedAt: 'desc' },
        take: 10,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        recentVideos,
        recentFavorites,
        recentViews,
      },
    });
  } catch (error) {
    console.error('getRecentActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
    });
  }
}

export async function exportData(req, res) {
  try {
    const [videos, categories] = await Promise.all([
      prisma.video.findMany({
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.category.findMany({
        include: { _count: { select: { videos: true } } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        videos,
        categories,
      },
    });
  } catch (error) {
    console.error('exportData error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export data',
    });
  }
}
