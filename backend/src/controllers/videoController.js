import Video from '../models/Video.js';
import Category from '../models/Category.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { cleanupTempFiles } from '../middleware/upload.js';
import { processVideoFile as processVideo } from '../services/videoProcessing.js';
import { uploadToCloud, deleteFromCloud } from '../services/cloudStorage.js';
import mongoose from 'mongoose';
import path from 'path';

export const getVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    status = 'published',
    sort = '-publishedAt',
    search,
    tags,
    featured,
    premium,
    language,
    minDuration,
    maxDuration,
  } = req.query;
  
  const query = {};
  
  if (status !== 'all') {
    query.status = status;
  }
  
  if (category) {
    query.category = category;
  }
  
  if (featured === 'true') {
    query.isFeatured = true;
  }
  
  if (premium === 'true') {
    query.isPremium = true;
  } else if (premium === 'false') {
    query.isPremium = false;
  }
  
  if (language) {
    query.language = language;
  }
  
  if (minDuration || maxDuration) {
    query['videoFile.duration'] = {};
    if (minDuration) query['videoFile.duration'].$gte = parseInt(minDuration);
    if (maxDuration) query['videoFile.duration'].$lte = parseInt(maxDuration);
  }
  
  if (tags) {
    query.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
  }
  
  if (search) {
    query.$text = { $search: search };
  }
  
  const videos = await Video.find(query)
    .populate('category', 'name slug icon iconColor gradient')
    .populate('series', 'title slug seasonCount episodeCount')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();
  
  const total = await Video.countDocuments(query);
  
  res.json({
    success: true,
    data: videos.map(v => v),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.admin && req.admin.role !== 'viewer';
  
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  let query = isObjectId ? { _id: id } : { slug: id };
  
  if (!isAdmin) {
    query.status = 'published';
    query.visibility = 'public';
  }
  
  const video = await Video.findOne(query)
    .populate('category', 'name slug icon iconColor gradient')
    .populate('series', 'title slug seasonCount episodeCount')
    .populate('addedBy', 'name email')
    .populate('updatedBy', 'name email');
  
  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }
  
  if (!isAdmin && video.isPremium) {
    // Check if user has premium access (would need user auth)
    // For now, allow access to all published videos
  }
  
  await video.incrementView();
  
  res.json({
    success: true,
    data: video.getPublicData ? video.getPublicData() : video,
  });
});

export const getVideoBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const isAdmin = req.admin && req.admin.role !== 'viewer';
  
  let query = { slug };
  
  if (!isAdmin) {
    query.status = 'published';
    query.visibility = 'public';
  }
  
  const video = await Video.findOne(query)
    .populate('category', 'name slug icon iconColor gradient')
    .populate('series', 'title slug seasonCount episodeCount')
    .populate('addedBy', 'name email')
    .populate('updatedBy', 'name email');
  
  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }
  
  await video.incrementView();
  
  res.json({
    success: true,
    data: video.getPublicData ? video.getPublicData() : video,
  });
});

export const createVideo = asyncHandler(async (req, res) => {
  const body = req.body;
  
  const title = body.title;
  const description = body.description;
  const shortDescription = body.shortDescription;
  const category = body.category;
  let tags = body.tags || [];
  if (!Array.isArray(tags)) tags = tags ? [tags] : [];
  tags = tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
  const status = body.status || 'published';
  const visibility = body.visibility || 'public';
  const ageRating = body.ageRating || 'G';
  const language = body.language || 'en';
  const allowComments = body.allowComments === 'false' ? false : !!body.allowComments;
  const allowEmbedding = body.allowEmbedding === 'false' ? false : !!body.allowEmbedding;
  const allowDownload = body.allowDownload === 'true' ? true : false;
  const isPremium = body.isPremium === 'true' ? true : false;
  const isFeatured = body.isFeatured === 'true' ? true : false;
  const season = body.season;
  const episode = body.episode;
  const series = body.series;
  const seoTitle = body.seoTitle;
  const seoDescription = body.seoDescription;
  let seoKeywords = body.seoKeywords || [];
  if (!Array.isArray(seoKeywords)) seoKeywords = seoKeywords ? [seoKeywords] : [];
  let chapters = body.chapters || [];
  if (!Array.isArray(chapters)) chapters = [];
  let subtitles = body.subtitles || [];
  if (!Array.isArray(subtitles)) subtitles = [];
  
  const videoFile = req.files?.video?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];
  const previewFile = req.files?.preview?.[0];
  const subtitleFiles = req.files?.subtitles || [];
  
  if (!videoFile) {
    cleanupTempFiles(req.files);
    throw new AppError('Video file is required', 400, 'Missing Video');
  }
  
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    cleanupTempFiles(req.files);
    throw new AppError('Category not found', 404, 'Not Found');
  }
  
  const video = new Video({
    title,
    description,
    shortDescription,
    category,
    tags,
    isFeatured,
    status,
    visibility,
    ageRating,
    language,
    allowComments,
    allowEmbedding,
    allowDownload,
    isPremium,
    season: season ? parseInt(season) : 1,
    episode: episode ? parseInt(episode) : 1,
    series: series || null,
    seoTitle,
    seoDescription,
    seoKeywords,
    chapters,
    subtitles,
    addedBy: req.admin._id,
    videoFile: {
      url: `/uploads/videos/${videoFile.filename}`,
      size: videoFile.size,
      format: videoFile.mimetype,
    },
    thumbnail: thumbnailFile ? { url: `/uploads/thumbnails/${thumbnailFile.filename}` } : null,
    previewVideo: previewFile ? { url: `/uploads/thumbnails/${previewFile.filename}` } : null,
    processingStatus: 'pending',
  });
  
  await video.save();
  
  // Process video asynchronously
  const absVideoPath = path.resolve(videoFile.path);
  const absThumbPath = thumbnailFile?.path ? path.resolve(thumbnailFile.path) : undefined;
  const absPreviewPath = previewFile?.path ? path.resolve(previewFile.path) : undefined;
  const absSubPaths = subtitleFiles.map(f => path.resolve(f.path));
  processVideoJob(video._id, absVideoPath, absThumbPath, absPreviewPath, absSubPaths)
    .catch(err => {
      console.error('Video processing failed:', err);
      Video.findByIdAndUpdate(video._id, {
        processingStatus: 'failed',
        processingError: err.message,
      }).exec();
    });
  
  res.status(201).json({
    success: true,
    message: 'Video uploaded successfully. Processing started.',
    data: {
      ...(video.getPublicData ? video.getPublicData() : video.toObject()),
      processingJobId: video._id,
    },
  });
});

export const updateVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const video = await Video.findById(id);
  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }
  
  const allowedUpdates = [
    'title', 'description', 'shortDescription', 'category', 'tags',
    'status', 'visibility', 'ageRating', 'language', 'allowComments',
    'allowEmbedding', 'allowDownload', 'isPremium', 'isFeatured',
    'season', 'episode', 'series', 'seoTitle', 'seoDescription',
    'seoKeywords', 'chapters', 'subtitles', 'thumbnail',
  ];
  
  for (const field of allowedUpdates) {
    if (updates[field] !== undefined) {
      if (field === 'tags') {
        video[field] = updates[field].map(t => t.trim().toLowerCase());
      } else if (field === 'category') {
        const cat = await Category.findById(updates[field]);
        if (!cat) throw new AppError('Category not found', 404, 'Not Found');
        video[field] = updates[field];
      } else {
        video[field] = updates[field];
      }
    }
  }
  
  if (req.files?.thumbnail?.[0]) {
    video.thumbnail = { url: `/uploads/thumbnails/${req.files.thumbnail[0].filename}` };
  }
  
  video.updatedBy = req.admin._id;
  await video.save();
  
  res.json({
    success: true,
    message: 'Video updated successfully',
    data: video.getPublicData ? video.getPublicData() : video,
  });
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const video = await Video.findById(id);
  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }
  
  // Delete from cloud storage
  if (video.videoFile?.url) {
    await deleteFromCloud(video.videoFile.url);
  }
  if (video.thumbnail?.url) {
    await deleteFromCloud(video.thumbnail.url);
  }
  if (video.previewVideo?.url) {
    await deleteFromCloud(video.previewVideo.url);
  }
  if (video.hlsPlaylistUrl) {
    await deleteFromCloud(video.hlsPlaylistUrl);
  }
  if (video.dashManifestUrl) {
    await deleteFromCloud(video.dashManifestUrl);
  }
  if (video.qualities) {
    for (const quality of video.qualities) {
      if (quality.url) await deleteFromCloud(quality.url);
    }
  }
  
  await video.deleteOne();
  
  res.json({
    success: true,
    message: 'Video deleted successfully',
  });
});

export const publishVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  
  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }
  
  video.status = 'published';
  video.publishedAt = new Date();
  video.publishedBy = req.admin._id;
  await video.save();
  
  res.json({
    success: true,
    message: 'Video published successfully',
    data: video.getPublicData ? video.getPublicData() : video,
  });
});

export const unpublishVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  
  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }
  
  video.status = 'unlisted';
  await video.save();
  
  res.json({
    success: true,
    message: 'Video unpublished successfully',
    data: video.getPublicData ? video.getPublicData() : video,
  });
});

export const featureVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { featured } = req.body;
  
  const video = await Video.findById(id);
  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }
  
  video.isFeatured = featured;
  if (featured) video.featuredAt = new Date();
  await video.save();
  
  res.json({
    success: true,
    message: featured ? 'Video featured' : 'Video unfeatured',
    data: video.getPublicData ? video.getPublicData() : video,
  });
});

export const getTrending = asyncHandler(async (req, res) => {
  const { limit = 10, days = 7 } = req.query;
  const videos = await Video.getTrending(parseInt(limit), parseInt(days));
  
  res.json({
    success: true,
    data: videos,
  });
});

export const getFeatured = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const videos = await Video.getFeatured(parseInt(limit));
  
  res.json({
    success: true,
    data: videos,
  });
});

export const getRelated = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;
  
  const video = await Video.findById(id);
  if (!video) {
    throw new AppError('Video not found', 404, 'Not Found');
  }
  
  const related = await Video.getRelated(id, video.category, video.tags, parseInt(limit));
  
  res.json({
    success: true,
    data: related,
  });
});

export const searchVideos = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20, category, tags, sort = '-publishedAt' } = req.query;
  
  if (!q) {
    throw new AppError('Search query is required', 400, 'Missing Query');
  }
  
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    category,
    tags: tags ? tags.split(',') : [],
    sort,
  };
  
  const videos = await Video.search(q, options);
  const total = await Video.countDocuments({
    status: 'published',
    $text: { $search: q },
  });
  
  res.json({
    success: true,
    data: videos,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getProcessStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const video = await Video.findById(jobId).select('processingStatus processingError title');
  if (!video) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }
  res.json({
    success: true,
    data: {
      id: video._id,
      status: video.processingStatus || 'pending',
      progress: video.processingStatus === 'completed' ? 100 : video.processingStatus === 'failed' ? 0 : 50,
      error: video.processingError || null,
    },
  });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await Video.aggregate([
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalLikes: { $sum: '$likeCount' },
        totalComments: { $sum: '$commentCount' },
        publishedVideos: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
        },
        draftVideos: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
        },
        processingVideos: {
          $sum: { $cond: [{ $eq: ['$processingStatus', 'processing'] }, 1, 0] },
        },
        failedVideos: {
          $sum: { $cond: [{ $eq: ['$processingStatus', 'failed'] }, 1, 0] },
        },
      },
    },
  ]);
  
  const categoryStats = await Video.aggregate([
    { $match: { status: 'published' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        views: { $sum: '$viewCount' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
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
        _id: 1,
        count: 1,
        views: 1,
        name: '$category.name',
        slug: '$category.slug',
        icon: '$category.icon',
        iconColor: '$category.iconColor',
        gradient: '$category.gradient',
      },
    },
  ]);
  
  const recentUploads = await Video.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('category', 'name slug')
    .select('title slug status processingStatus viewCount createdAt category')
    .lean();
  
  res.json({
    success: true,
    data: {
      overview: stats[0] || {},
      byCategory: categoryStats,
      recentUploads,
    },
  });
});

const processVideoJob = async (videoId, videoPath, thumbnailPath, previewPath, subtitlePaths) => {
  const video = await Video.findById(videoId);
  if (!video) return;
  
  video.processingStatus = 'processing';
  await video.save({ validateBeforeSave: false });
  
  try {
    const processed = await processVideo(videoId.toString(), videoPath, {
      generateThumbnails: true,
      generatePreview: true,
      generateHLS: true,
      generateDASH: true,
    });
    
    video.videoFile.duration = processed.metadata?.duration || 0;
    video.videoFile.size = processed.metadata?.size || video.videoFile.size;
    video.videoFile.format = processed.metadata?.format || '';
    video.videoFile.bitrate = processed.metadata?.bitrate || 0;
    video.videoFile.codec = processed.metadata?.codec || '';
    video.qualities = processed.qualities || [];
    video.hlsPlaylistUrl = processed.hls?.playlistUrl || null;
    video.dashManifestUrl = processed.dash?.manifestUrl || null;
    video.thumbnails = processed.thumbnails || [];
    video.sprite = processed.sprite || null;
    video.processingStatus = 'completed';
    
    if (thumbnailPath) {
      const thumb = await uploadToCloud(thumbnailPath, `thumbnails/${videoId}`);
      video.thumbnail = { url: thumb.url, width: thumb.width, height: thumb.height };
    } else if (processed.thumbnail) {
      const relPath = processed.thumbnail.replace(/\\/g, '/').replace(/.*uploads\//, '/uploads/');
      video.thumbnail = { url: relPath };
    } else if (processed.thumbnails?.length > 0) {
      const relPath = processed.thumbnails[0].url.replace(/\\/g, '/').replace(/.*uploads\//, '/uploads/');
      video.thumbnail = { url: relPath };
    }
    
    if (previewPath) {
      const preview = await uploadToCloud(previewPath, `previews/${videoId}`);
      video.previewVideo = { url: preview.url, duration: preview.duration };
    }
    
    if (subtitlePaths.length > 0) {
      for (const subPath of subtitlePaths) {
        const sub = await uploadToCloud(subPath, `subtitles/${videoId}`);
        video.subtitles.push({ url: sub.url, language: 'en', label: 'English' });
      }
    }
    
    await video.save({ validateBeforeSave: false });
    
    // Update category stats
    await Category.findByIdAndUpdate(video.category, {
      $inc: { videoCount: 1 },
    });
    
  } catch (error) {
    video.processingStatus = 'failed';
    video.processingError = error.message;
    await video.save({ validateBeforeSave: false });
    throw error;
  }
};