import Category from '../models/Category.js';
import Video from '../models/Video.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { uploadToCloud, deleteFromCloud } from '../services/cloudStorage.js';

export const getCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    parent,
    isActive,
    isFeatured,
    showOnHomepage,
    sort = 'order',
    search,
  } = req.query;
  
  const query = {};
  
  if (parent !== undefined) {
    query.parent = parent === 'null' ? null : parent;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === 'true';
  }
  
  if (showOnHomepage !== undefined) {
    query.showOnHomepage = showOnHomepage === 'true';
  }
  
  if (search) {
    query.$text = { $search: search };
  }
  
  const categories = await Category.find(query)
    .populate('parent', 'name slug')
    .populate('children', 'name slug icon iconColor gradient videoCount order isActive isFeatured')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();
  
  const total = await Category.countDocuments(query);
  
  res.json({
    success: true,
    data: categories,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .select('name slug icon iconColor gradient parent order children')
    .sort({ order: 1, name: 1 })
    .lean();
  
  const categoryMap = new Map();
  const roots = [];
  
  categories.forEach(cat => {
    categoryMap.set(cat._id.toString(), { ...cat, children: [] });
  });
  
  categories.forEach(cat => {
    const catObj = categoryMap.get(cat._id.toString());
    if (cat.parent) {
      const parent = categoryMap.get(cat.parent.toString());
      if (parent) parent.children.push(catObj);
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
  
  const category = await Category.findById(id)
    .populate('parent', 'name slug')
    .populate('children', 'name slug icon iconColor gradient videoCount order isActive isFeatured')
    .lean();
  
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
  
  const category = await Category.findOne({ slug, isActive: true })
    .populate('parent', 'name slug')
    .populate('children', 'name slug icon iconColor gradient videoCount order isActive isFeatured')
    .lean();
  
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
    shortDescription,
    slug,
    parent,
    icon,
    iconColor,
    gradient,
    order = 0,
    isFeatured = false,
    showOnHomepage = false,
    seoTitle,
    seoDescription,
    seoKeywords = [],
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
  } = req.body;
  
  if (parent) {
    const parentCat = await Category.findById(parent);
    if (!parentCat) {
      throw new AppError('Parent category not found', 404, 'Not Found');
    }
  }
  
  const category = new Category({
    name,
    description,
    shortDescription,
    slug,
    parent: parent || null,
    icon,
    iconColor: iconColor || '#6366f1',
    gradient: gradient || 'from-indigo-500 to-purple-600',
    order,
    isFeatured,
    showOnHomepage,
    seoTitle,
    seoDescription,
    seoKeywords,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard: twitterCard || 'summary_large_image',
    twitterTitle,
    twitterDescription,
    twitterImage,
    createdBy: req.admin._id,
  });
  
  if (req.files?.thumbnail?.[0]) {
    const uploaded = await uploadToCloud(req.files.thumbnail[0].path, `categories/${category._id}`);
    category.thumbnail = { url: uploaded.url, width: uploaded.width, height: uploaded.height };
  }
  
  await category.save();
  
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404, 'Not Found');
  }
  
  const allowedUpdates = [
    'name', 'description', 'shortDescription', 'slug', 'parent',
    'icon', 'iconColor', 'gradient', 'thumbnail',
    'order', 'isActive', 'isFeatured', 'showOnHomepage',
    'seoTitle', 'seoDescription', 'seoKeywords',
    'ogTitle', 'ogDescription', 'ogImage',
    'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
  ];
  
  for (const field of allowedUpdates) {
    if (updates[field] !== undefined) {
      if (field === 'parent') {
        if (updates[field] === 'null' || updates[field] === '') {
          category[field] = null;
        } else if (updates[field] !== category.parent?.toString()) {
          const parentCat = await Category.findById(updates[field]);
          if (!parentCat) throw new AppError('Parent category not found', 404, 'Not Found');
          if (parentCat._id.toString() === category._id.toString()) {
            throw new AppError('Category cannot be its own parent', 400, 'Invalid Parent');
          }
          category[field] = updates[field];
        }
      } else {
        category[field] = updates[field];
      }
    }
  }
  
  if (req.files?.thumbnail?.[0]) {
    if (category.thumbnail?.url) {
      await deleteFromCloud(category.thumbnail.url);
    }
    const uploaded = await uploadToCloud(req.files.thumbnail[0].path, `categories/${id}`);
    category.thumbnail = { url: uploaded.url, width: uploaded.width, height: uploaded.height };
  }
  
  category.updatedBy = req.admin._id;
  await category.save();
  
  res.json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { force = false, moveVideosTo } = req.query;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404, 'Not Found');
  }
  
  const childrenCount = await Category.countDocuments({ parent: id });
  if (childrenCount > 0 && !force) {
    throw new AppError('Category has subcategories. Use force=true to delete anyway.', 400, 'Has Children');
  }
  
  const videosCount = await Video.countDocuments({ category: id });
  if (videosCount > 0) {
    if (moveVideosTo) {
      const targetCategory = await Category.findById(moveVideosTo);
      if (!targetCategory) {
        throw new AppError('Target category not found', 404, 'Not Found');
      }
      await Video.updateMany({ category: id }, { category: moveVideosTo });
      await targetCategory.incrementVideoCount(videosCount);
    } else if (!force) {
      throw new AppError(`Category has ${videosCount} videos. Use force=true or moveVideosTo to proceed.`, 400, 'Has Videos');
    } else {
      await Video.updateMany({ category: id }, { $unset: { category: 1 } });
    }
  }
  
  if (category.thumbnail?.url) {
    await deleteFromCloud(category.thumbnail.url);
  }
  
  await category.deleteOne();
  
  if (category.parent) {
    await Category.findByIdAndUpdate(category.parent, { $inc: { videoCount: -videosCount } });
  }
  
  if (childrenCount > 0 && force) {
    await Category.deleteMany({ parent: id });
  }
  
  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});

export const reorderCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;
  
  if (!Array.isArray(categories)) {
    throw new AppError('Categories array is required', 400, 'Invalid Input');
  }
  
  const bulkOps = categories.map((cat, index) => ({
    updateOne: {
      filter: { _id: cat.id },
      update: { order: cat.order !== undefined ? cat.order : index },
    },
  }));
  
  await Category.bulkWrite(bulkOps);
  
  res.json({
    success: true,
    message: 'Categories reordered successfully',
  });
});

export const getCategoryStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404, 'Not Found');
  }
  
  const videoStats = await Video.aggregate([
    { $match: { category: category._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        views: { $sum: '$viewCount' },
        likes: { $sum: '$likeCount' },
        comments: { $sum: '$commentCount' },
        duration: { $sum: '$videoFile.duration' },
      },
    },
  ]);
  
  const recentVideos = await Video.find({ category: category._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('category', 'name slug')
    .select('title slug status viewCount likeCount createdAt')
    .lean();
  
  res.json({
    success: true,
    data: {
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        videoCount: category.videoCount,
        viewCount: category.viewCount,
      },
      videoStats,
      recentVideos,
    },
  });
});

export const getHomepageCategories = asyncHandler(async (req, res) => {
  const categories = await Category.getHomepageCategories();
  
  res.json({
    success: true,
    data: categories,
  });
});

export const getFeaturedCategories = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const categories = await Category.getFeatured(parseInt(limit));
  
  res.json({
    success: true,
    data: categories,
  });
});

export const bulkUpdateCategories = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  
  if (!Array.isArray(updates)) {
    throw new AppError('Updates array is required', 400, 'Invalid Input');
  }
  
  const bulkOps = updates.map(update => {
    const { id, ...fields } = update;
    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: fields },
      },
    };
  });
  
  await Category.bulkWrite(bulkOps);
  
  res.json({
    success: true,
    message: 'Categories updated successfully',
  });
});

export const searchCategories = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q) {
    return res.json({ success: true, data: [] });
  }
  
  const categories = await Category.find({
    $text: { $search: q },
    isActive: true,
  })
    .select('name slug icon iconColor gradient videoCount')
    .limit(parseInt(limit))
    .lean();
  
  res.json({
    success: true,
    data: categories,
  });
});