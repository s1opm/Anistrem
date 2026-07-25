import prisma from '../db/index.js';
import slugify from 'slugify';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const VIDEO_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      iconColor: true,
      gradient: true,
    },
  },
};

function generateSlug(title, id) {
  let base = slugify(title, { lower: true, strict: true });
  if (id) base = `${base}-${id.slice(0, 8)}`;
  return base;
}

export const getVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    status,
    visibility,
    sort = 'createdAt',
    search,
    tag,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (visibility) {
    where.visibility = visibility;
  }

  if (category) {
    where.OR = [
      { categoryId: category },
      { category: { slug: category } },
    ];
  }

  if (tag) {
    const tags = tag.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (tags.length === 1) {
      where.tags = { has: tags[0] };
    } else if (tags.length > 1) {
      where.tags = { hasSome: tags };
    }
  }

  if (search) {
    where.OR = [
      ...(where.OR || []),
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { hasSome: [search.toLowerCase()] } },
    ];
  }

  let orderBy = {};
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc';
  const allowedSortFields = [
    'createdAt', 'updatedAt', 'publishedAt', 'viewCount',
    'likeCount', 'commentCount', 'title',
  ];
  if (allowedSortFields.includes(sortField)) {
    orderBy = { [sortField]: sortDirection };
  } else {
    orderBy = { createdAt: 'desc' };
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: VIDEO_INCLUDE,
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.video.count({ where }),
  ]);

  res.json({
    success: true,
    data: videos,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await prisma.video.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: VIDEO_INCLUDE,
  });

  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  res.json({
    success: true,
    data: video,
  });
});

export const getVideoBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const video = await prisma.video.findUnique({
    where: { slug },
    include: VIDEO_INCLUDE,
  });

  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  res.json({
    success: true,
    data: video,
  });
});

export const createVideo = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    tags = [],
    categoryId,
    status = 'draft',
    visibility = 'public',
    metaTitle,
    metaDescription,
    canonicalUrl,
    seasonNumber,
    episodeNumber,
    seriesId,
    seriesTitle,
    scheduledAt,
    expiresAt,
  } = req.body;

  if (!title) {
    throw new AppError('Title is required', 400, 'Validation Error');
  }

  if (!categoryId) {
    throw new AppError('Category is required', 400, 'Validation Error');
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404, 'Not Found');
  }

  const videoTags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [];

  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let slugExists = await prisma.video.findUnique({ where: { slug } });
  let counter = 1;
  while (slugExists) {
    slug = `${baseSlug}-${counter}`;
    slugExists = await prisma.video.findUnique({ where: { slug } });
    counter++;
  }

  const videoUrl = req.file ? `/uploads/videos/${req.file.filename}` : null;

  const video = await prisma.video.create({
    data: {
      title,
      slug,
      description: description || null,
      tags: videoTags,
      categoryId,
      status,
      visibility,
      videoUrl,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      seasonNumber: seasonNumber ? parseInt(seasonNumber, 10) : null,
      episodeNumber: episodeNumber ? parseInt(episodeNumber, 10) : null,
      seriesId: seriesId || null,
      seriesTitle: seriesTitle || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      addedByAdminId: req.admin?.id || null,
    },
    include: VIDEO_INCLUDE,
  });

  res.status(201).json({
    success: true,
    message: 'Video created successfully',
    data: video,
  });
});

export const updateVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.video.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  const {
    title,
    description,
    tags,
    categoryId,
    status,
    visibility,
    metaTitle,
    metaDescription,
    canonicalUrl,
    seasonNumber,
    episodeNumber,
    seriesId,
    seriesTitle,
    scheduledAt,
    expiresAt,
  } = req.body;

  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (visibility !== undefined) updateData.visibility = visibility;
  if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
  if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
  if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl;
  if (seasonNumber !== undefined) updateData.seasonNumber = seasonNumber ? parseInt(seasonNumber, 10) : null;
  if (episodeNumber !== undefined) updateData.episodeNumber = episodeNumber ? parseInt(episodeNumber, 10) : null;
  if (seriesId !== undefined) updateData.seriesId = seriesId || null;
  if (seriesTitle !== undefined) updateData.seriesTitle = seriesTitle || null;
  if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

  if (tags !== undefined) {
    updateData.tags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      : [];
  }

  if (categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new AppError('Category not found', 404, 'Not Found');
    }
    updateData.categoryId = categoryId;
  }

  if (req.file) {
    updateData.videoUrl = `/uploads/videos/${req.file.filename}`;
  }

  if (title !== undefined && title !== existing.title) {
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let slugExists = await prisma.video.findFirst({
      where: { slug, NOT: { id } },
    });
    let counter = 1;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await prisma.video.findFirst({
        where: { slug, NOT: { id } },
      });
      counter++;
    }
    updateData.slug = slug;
  }

  updateData.updatedByAdminId = req.admin?.id || null;

  const video = await prisma.video.update({
    where: { id },
    data: updateData,
    include: VIDEO_INCLUDE,
  });

  res.json({
    success: true,
    message: 'Video updated successfully',
    data: video,
  });
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  await prisma.video.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Video deleted successfully',
  });
});

export const publishVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  const updated = await prisma.video.update({
    where: { id },
    data: {
      status: 'published',
      publishedAt: new Date(),
      publishedByAdminId: req.admin?.id || null,
      updatedByAdminId: req.admin?.id || null,
    },
    include: VIDEO_INCLUDE,
  });

  res.json({
    success: true,
    message: 'Video published successfully',
    data: updated,
  });
});

export const unpublishVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  const updated = await prisma.video.update({
    where: { id },
    data: {
      status: 'draft',
      publishedAt: null,
      updatedByAdminId: req.admin?.id || null,
    },
    include: VIDEO_INCLUDE,
  });

  res.json({
    success: true,
    message: 'Video unpublished successfully',
    data: updated,
  });
});

export const featureVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  const updated = await prisma.video.update({
    where: { id },
    data: {
      isFeatured: !video.isFeatured,
      updatedByAdminId: req.admin?.id || null,
    },
    include: VIDEO_INCLUDE,
  });

  res.json({
    success: true,
    message: updated.isFeatured ? 'Video featured' : 'Video unfeatured',
    data: updated,
  });
});

export const getTrending = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const videos = await prisma.video.findMany({
    where: {
      status: 'published',
      visibility: 'public',
    },
    include: VIDEO_INCLUDE,
    orderBy: { viewCount: 'desc' },
    take: limitNum,
  });

  res.json({
    success: true,
    data: videos,
  });
});

export const getFeatured = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const videos = await prisma.video.findMany({
    where: {
      isFeatured: true,
      status: 'published',
      visibility: 'public',
    },
    include: VIDEO_INCLUDE,
    orderBy: { publishedAt: 'desc' },
    take: limitNum,
  });

  res.json({
    success: true,
    data: videos,
  });
});

export const getRelated = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 8 } = req.query;
  const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 8));

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  const related = await prisma.video.findMany({
    where: {
      id: { not: id },
      categoryId: video.categoryId,
      status: 'published',
      visibility: 'public',
    },
    include: VIDEO_INCLUDE,
    orderBy: { viewCount: 'desc' },
    take: limitNum,
  });

  res.json({
    success: true,
    data: related,
  });
});

export const searchVideos = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q) {
    throw new AppError('Search query is required', 400, 'Validation Error');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    status: 'published',
    visibility: 'public',
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { tags: { hasSome: [q.toLowerCase()] } },
    ],
  };

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: VIDEO_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.video.count({ where }),
  ]);

  res.json({
    success: true,
    data: videos,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await prisma.video.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      likeCount: true,
      dislikeCount: true,
      commentCount: true,
      shareCount: true,
      favoriteCount: true,
      averageWatchTime: true,
    },
  });

  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }

  res.json({
    success: true,
    data: {
      id: video.id,
      title: video.title,
      slug: video.slug,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      dislikeCount: video.dislikeCount,
      commentCount: video.commentCount,
      shareCount: video.shareCount,
      favoriteCount: video.favoriteCount,
      averageWatchTime: video.averageWatchTime,
    },
  });
});
