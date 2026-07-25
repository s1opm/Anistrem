import prisma from '../db/index.js';
import slugify from 'slugify';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

function generateSlug(name, id) {
  let base = slugify(name, { lower: true, strict: true });
  if (id) base = `${base}-${id.slice(0, 8)}`;
  return base;
}

const CATEGORY_INCLUDE = {
  _count: { select: { videos: true } },
  parent: { select: { id: true, name: true, slug: true } },
  children: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      iconColor: true,
      gradient: true,
      order: true,
      isActive: true,
      isFeatured: true,
      videoCount: true,
      _count: { select: { videos: true } },
    },
    orderBy: { order: 'asc' },
  },
};

export const getCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    isActive,
    sort = 'order',
    search,
    isFeatured,
    showOnHomepage,
    parentId,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (isFeatured !== undefined) {
    where.isFeatured = isFeatured === 'true';
  }

  if (showOnHomepage !== undefined) {
    where.showOnHomepage = showOnHomepage === 'true';
  }

  if (parentId !== undefined) {
    where.parentId = parentId === 'null' ? null : parentId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy = {};
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc';
  const allowedSortFields = [
    'name', 'order', 'createdAt', 'updatedAt', 'videoCount', 'viewCount',
  ];
  if (allowedSortFields.includes(sortField)) {
    orderBy = { [sortField]: sortDirection };
  } else {
    orderBy = { order: 'asc' };
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: CATEGORY_INCLUDE,
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.category.count({ where }),
  ]);

  res.json({
    success: true,
    data: categories,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      iconColor: true,
      gradient: true,
      order: true,
      parentId: true,
      videoCount: true,
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  const categoryMap = new Map();
  const roots = [];

  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const catObj = categoryMap.get(cat.id);
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(catObj);
      } else {
        roots.push(catObj);
      }
    } else {
      roots.push(catObj);
    }
  });

  res.json({
    success: true,
    data: roots,
  });
});

export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: CATEGORY_INCLUDE,
  });

  if (!category) {
    throw new AppError('Category not found', 404, 'Not Found');
  }

  res.json({
    success: true,
    data: category,
  });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: CATEGORY_INCLUDE,
  });

  if (!category) {
    throw new AppError('Category not found', 404, 'Not Found');
  }

  res.json({
    success: true,
    data: category,
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    icon,
    iconColor,
    gradient,
    thumbnail,
    parentId,
    order = 0,
    isActive = true,
    isFeatured = false,
    showOnHomepage = false,
    metaTitle,
    metaDescription,
    keywords = [],
  } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Name is required', 400, 'Validation Error');
  }

  if (parentId) {
    const parentCat = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parentCat) {
      throw new AppError('Parent category not found', 404, 'Not Found');
    }
  }

  let slug = generateSlug(name);
  let slugExists = await prisma.category.findUnique({ where: { slug } });
  let counter = 1;
  while (slugExists) {
    slug = `${generateSlug(name)}-${counter}`;
    slugExists = await prisma.category.findUnique({ where: { slug } });
    counter++;
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      description: description || null,
      icon: icon || null,
      iconColor: iconColor || null,
      gradient: gradient || null,
      thumbnail: thumbnail || null,
      parentId: parentId || null,
      order,
      isActive,
      isFeatured,
      showOnHomepage,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      keywords: Array.isArray(keywords) ? keywords : [],
      createdByAdminId: req.admin?.id || null,
    },
    include: CATEGORY_INCLUDE,
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Category not found', 404, 'Not Found');
  }

  const {
    name,
    description,
    icon,
    iconColor,
    gradient,
    thumbnail,
    parentId,
    order,
    isActive,
    isFeatured,
    showOnHomepage,
    metaTitle,
    metaDescription,
    keywords,
  } = req.body;

  const updateData = {};

  if (name !== undefined) {
    updateData.name = name.trim();
    if (name !== existing.name) {
      const baseSlug = slugify(name, { lower: true, strict: true });
      let slug = baseSlug;
      let slugExists = await prisma.category.findFirst({
        where: { slug, NOT: { id } },
      });
      let counter = 1;
      while (slugExists) {
        slug = `${baseSlug}-${counter}`;
        slugExists = await prisma.category.findFirst({
          where: { slug, NOT: { id } },
        });
        counter++;
      }
      updateData.slug = slug;
    }
  }

  if (description !== undefined) updateData.description = description || null;
  if (icon !== undefined) updateData.icon = icon || null;
  if (iconColor !== undefined) updateData.iconColor = iconColor || null;
  if (gradient !== undefined) updateData.gradient = gradient || null;
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null;
  if (order !== undefined) updateData.order = parseInt(order, 10);
  if (isActive !== undefined) updateData.isActive = isActive;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
  if (showOnHomepage !== undefined) updateData.showOnHomepage = showOnHomepage;
  if (metaTitle !== undefined) updateData.metaTitle = metaTitle || null;
  if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null;
  if (keywords !== undefined) {
    updateData.keywords = Array.isArray(keywords) ? keywords : [];
  }

  if (parentId !== undefined) {
    const newParentId = parentId === 'null' || parentId === '' ? null : parentId;

    if (newParentId && newParentId === id) {
      throw new AppError('Category cannot be its own parent', 400, 'Invalid Parent');
    }

    if (newParentId) {
      const parentCat = await prisma.category.findUnique({ where: { id: newParentId } });
      if (!parentCat) {
        throw new AppError('Parent category not found', 404, 'Not Found');
      }
    }

    updateData.parentId = newParentId;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No fields to update', 400, 'Validation Error');
  }

  updateData.updatedByAdminId = req.admin?.id || null;

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
    include: CATEGORY_INCLUDE,
  });

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { force = 'false', moveVideosTo } = req.query;

  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError('Category not found', 404, 'Not Found');
  }

  const childrenCount = await prisma.category.count({ where: { parentId: id } });
  if (childrenCount > 0 && force !== 'true') {
    throw new AppError(
      'Category has subcategories. Use force=true to delete anyway.',
      400,
      'Has Children'
    );
  }

  const videosCount = await prisma.video.count({ where: { categoryId: id } });
  if (videosCount > 0) {
    if (moveVideosTo) {
      const targetCategory = await prisma.category.findUnique({ where: { id: moveVideosTo } });
      if (!targetCategory) {
        throw new AppError('Target category not found', 404, 'Not Found');
      }

      await prisma.video.updateMany({
        where: { categoryId: id },
        data: { categoryId: moveVideosTo },
      });

      await prisma.category.update({
        where: { id: moveVideosTo },
        data: { videoCount: { increment: videosCount } },
      });
    } else if (force !== 'true') {
      throw new AppError(
        `Category has ${videosCount} videos. Use force=true or moveVideosTo to proceed.`,
        400,
        'Has Videos'
      );
    } else {
      await prisma.category.update({
        where: { id },
        data: { videoCount: 0 },
      });
    }
  }

  await prisma.category.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});

export const reorderCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    throw new AppError('Categories array is required', 400, 'Validation Error');
  }

  const updates = categories.map((cat) =>
    prisma.category.update({
      where: { id: cat.id },
      data: { order: cat.order !== undefined ? parseInt(cat.order, 10) : 0 },
    })
  );

  await prisma.$transaction(updates);

  res.json({
    success: true,
    message: 'Categories reordered successfully',
  });
});

export const getCategoryStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      videoCount: true,
      viewCount: true,
      order: true,
      isActive: true,
      isFeatured: true,
      showOnHomepage: true,
      createdAt: true,
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404, 'Not Found');
  }

  const [videoAggregates, videoStatusCounts, recentVideos, childCategories] =
    await Promise.all([
      prisma.video.aggregate({
        where: { categoryId: id },
        _sum: {
          viewCount: true,
          likeCount: true,
          dislikeCount: true,
          commentCount: true,
          shareCount: true,
          favoriteCount: true,
          videoDuration: true,
        },
        _avg: { averageWatchTime: true },
        _count: true,
      }),
      prisma.video.groupBy({
        by: ['status'],
        where: { categoryId: id },
        _count: { status: true },
        _sum: { viewCount: true },
      }),
      prisma.video.findMany({
        where: { categoryId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          viewCount: true,
          likeCount: true,
          createdAt: true,
        },
      }),
      prisma.category.findMany({
        where: { parentId: id },
        select: {
          id: true,
          name: true,
          slug: true,
          videoCount: true,
          viewCount: true,
        },
        orderBy: { order: 'asc' },
      }),
    ]);

  res.json({
    success: true,
    data: {
      category,
      videoStats: {
        totalVideos: videoAggregates._count,
        totalViews: videoAggregates._sum.viewCount || 0,
        totalLikes: videoAggregates._sum.likeCount || 0,
        totalDislikes: videoAggregates._sum.dislikeCount || 0,
        totalComments: videoAggregates._sum.commentCount || 0,
        totalShares: videoAggregates._sum.shareCount || 0,
        totalFavorites: videoAggregates._sum.favoriteCount || 0,
        totalDuration: videoAggregates._sum.videoDuration || 0,
        averageWatchTime: videoAggregates._avg.averageWatchTime || 0,
      },
      statusBreakdown: videoStatusCounts,
      recentVideos,
      childCategories,
    },
  });
});

export const getHomepageCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: {
      showOnHomepage: true,
      isActive: true,
    },
    include: CATEGORY_INCLUDE,
    orderBy: { order: 'asc' },
  });

  res.json({
    success: true,
    data: categories,
  });
});

export const getFeaturedCategories = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const categories = await prisma.category.findMany({
    where: {
      isFeatured: true,
      isActive: true,
    },
    include: CATEGORY_INCLUDE,
    orderBy: { order: 'asc' },
    take: limitNum,
  });

  res.json({
    success: true,
    data: categories,
  });
});

export const bulkUpdateCategories = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new AppError('Updates array is required', 400, 'Validation Error');
  }

  const allowedFields = [
    'isActive', 'isFeatured', 'showOnHomepage', 'order',
    'parentId', 'icon', 'iconColor', 'gradient',
  ];

  const results = await prisma.$transaction(
    updates.map((update) => {
      const { id, ...fields } = update;

      if (!id) {
        throw new AppError('Each update must include an id', 400, 'Validation Error');
      }

      const sanitizedFields = {};
      for (const [key, value] of Object.entries(fields)) {
        if (allowedFields.includes(key)) {
          sanitizedFields[key] = value;
        }
      }

      sanitizedFields.updatedByAdminId = req.admin?.id || null;

      return prisma.category.update({
        where: { id },
        data: sanitizedFields,
      });
    })
  );

  res.json({
    success: true,
    message: `${results.length} categories updated successfully`,
    data: results,
  });
});

export const searchCategories = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || !q.trim()) {
    return res.json({ success: true, data: [] });
  }

  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      iconColor: true,
      gradient: true,
      videoCount: true,
      description: true,
    },
    orderBy: { name: 'asc' },
    take: limitNum,
  });

  res.json({
    success: true,
    data: categories,
  });
});
