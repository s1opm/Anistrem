import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

const videoSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  shortTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Short title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters'],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  status: {
    type: String,
    enum: ['draft', 'processing', 'published', 'unlisted', 'archived'],
    default: 'draft',
    index: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'subscribers', 'premium'],
    default: 'public',
  },
  ageRating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
    default: 'G',
  },
  language: {
    type: String,
    default: 'en',
    maxlength: [10, 'Language code too long'],
  },
  subtitles: [{
    language: {
      type: String,
      required: true,
      maxlength: 10,
    },
    label: {
      type: String,
      required: true,
      maxlength: 50,
    },
    url: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  }],
  videoFile: {
    url: {
      type: String,
      required: [true, 'Video file URL is required'],
    },
    duration: {
      type: Number,
      default: 0,
    },
    size: {
      type: Number,
      default: 0,
    },
    format: String,
    width: Number,
    height: Number,
    bitrate: Number,
    codec: String,
    fps: Number,
  },
  qualities: [{
    quality: {
      type: String,
      enum: ['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', '4320p'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    width: Number,
    height: Number,
    bitrate: Number,
    size: Number,
    codec: String,
  }],
  thumbnail: {
    url: {
      type: String,
    },
    width: Number,
    height: Number,
  },
  thumbnails: [{
    time: Number,
    url: String,
    width: Number,
    height: Number,
  }],
  previewVideo: {
    url: String,
    duration: Number,
    startTime: Number,
    endTime: Number,
  },
  sprite: {
    url: String,
    columns: Number,
    rows: Number,
    interval: Number,
    width: Number,
    height: Number,
  },
  chapters: [{
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    startTime: {
      type: Number,
      required: true,
      min: 0,
    },
    endTime: {
      type: Number,
      min: 0,
    },
    thumbnail: String,
  }],
  season: {
    type: Number,
    default: 1,
    min: 1,
  },
  episode: {
    type: Number,
    default: 1,
    min: 1,
  },
  series: {
    type: Schema.Types.ObjectId,
    ref: 'Series',
    index: true,
  },
  viewCount: {
    type: Number,
    default: 0,
    index: true,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  dislikeCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  watchTime: {
    type: Number,
    default: 0,
  },
  averageWatchTime: {
    type: Number,
    default: 0,
  },
  completionRate: {
    type: Number,
    default: 0,
  },
  publishedAt: {
    type: Date,
    index: true,
  },
  scheduledAt: {
    type: Date,
    index: true,
  },
  featuredAt: {
    type: Date,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  isTrending: {
    type: Boolean,
    default: false,
  },
  trendingScore: {
    type: Number,
    default: 0,
  },
  allowComments: {
    type: Boolean,
    default: true,
  },
  allowEmbedding: {
    type: Boolean,
    default: true,
  },
  allowDownload: {
    type: Boolean,
    default: false,
  },
  allowRatings: {
    type: Boolean,
    default: true,
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: [70, 'SEO title cannot exceed 70 characters'],
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'SEO description cannot exceed 160 characters'],
  },
  seoKeywords: [{
    type: String,
    trim: true,
  }],
  canonicalUrl: String,
  ogTitle: String,
  ogDescription: String,
  ogImage: String,
  ogVideo: String,
  ogVideoWidth: Number,
  ogVideoHeight: Number,
  twitterCard: {
    type: String,
    enum: ['summary', 'summary_large_image', 'player'],
    default: 'player',
  },
  twitterTitle: String,
  twitterDescription: String,
  twitterImage: String,
  twitterPlayer: String,
  twitterPlayerWidth: Number,
  twitterPlayerHeight: Number,
  structuredData: Schema.Types.Mixed,
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  processingProgress: {
    type: Number,
    default: 0,
  },
  processingError: String,
  processingStartedAt: Date,
  processingCompletedAt: Date,
  hlsPlaylistUrl: String,
  dashManifestUrl: String,
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
  },
  publishedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ category: 1, status: 1, publishedAt: -1 });
videoSchema.index({ status: 1, publishedAt: -1 });
videoSchema.index({ isFeatured: 1, status: 1, publishedAt: -1 });
videoSchema.index({ series: 1, season: 1, episode: 1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ viewCount: -1 });
videoSchema.index({ likeCount: -1 });
videoSchema.index({ trendingScore: -1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ processingStatus: 1 });

videoSchema.virtual('likes', {
  ref: 'VideoLike',
  localField: '_id',
  foreignField: 'video',
});

videoSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'video',
});

videoSchema.virtual('views', {
  ref: 'VideoView',
  localField: '_id',
  foreignField: 'video',
});

videoSchema.virtual('durationFormatted').get(function() {
  if (!this.videoFile?.duration) return '0:00';
  const hrs = Math.floor(this.videoFile.duration / 3600);
  const mins = Math.floor((this.videoFile.duration % 3600) / 60);
  const secs = Math.floor(this.videoFile.duration % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

videoSchema.virtual('isProcessing').get(function() {
  return this.processingStatus === 'processing' || this.processingStatus === 'pending';
});

videoSchema.virtual('availableQualities').get(function() {
  return this.qualities?.map(q => q.quality) || ['auto'];
});

videoSchema.pre('validate', function(next) {
  if (this.isNew && this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

videoSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.isNew) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
  
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  if (this.isModified('isFeatured') && this.isFeatured && !this.featuredAt) {
    this.featuredAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'published') {
    this.publishedBy = this.updatedBy || this.addedBy;
  }
  
  next();
});

videoSchema.post('save', async function() {
  if (this.isNew && this.category) {
    await this.model('Category').findByIdAndUpdate(this.category, {
      $inc: { videoCount: 1 },
    });
  }
});

videoSchema.statics.getPublished = function(query = {}) {
  return this.find({ 
    status: 'published', 
    ...query 
  }).sort({ publishedAt: -1 });
};

videoSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ 
    status: 'published', 
    isFeatured: true 
  })
  .sort({ featuredAt: -1, publishedAt: -1 })
  .limit(limit)
  .populate('category', 'name slug icon iconColor gradient');
};

videoSchema.statics.getTrending = function(limit = 20, days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        status: 'published',
        publishedAt: { $gte: date },
      },
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$viewCount', 1] },
            { $multiply: ['$likeCount', 5] },
            { $multiply: ['$commentCount', 3] },
            { $multiply: ['$shareCount', 10] },
            { $multiply: ['$watchTime', 0.001] },
          ],
        },
      },
    },
    { $sort: { trendingScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        title: 1,
        slug: 1,
        thumbnail: 1,
        duration: '$videoFile.duration',
        viewCount: 1,
        likeCount: 1,
        publishedAt: 1,
        category: { name: 1, slug: 1, icon: 1, iconColor: 1, gradient: 1 },
      },
    },
  ]);
};

videoSchema.statics.getRelated = function(videoId, categoryId, tags, limit = 10) {
  return this.find({
    _id: { $ne: videoId },
    status: 'published',
    $or: [
      { category: categoryId },
      { tags: { $in: tags } },
    ],
  })
  .sort({ viewCount: -1, likeCount: -1, publishedAt: -1 })
  .limit(limit)
  .populate('category', 'name slug icon iconColor gradient');
};

videoSchema.statics.search = function(query, options = {}) {
  const { page = 1, limit = 20, category, tags, status = 'published', sort = '-publishedAt' } = options;
  const searchQuery = {
    status,
    $text: { $search: query },
  };
  
  if (category) searchQuery.category = category;
  if (tags && tags.length > 0) searchQuery.tags = { $in: tags };
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, ...sort.split(',').reduce((acc, s) => {
      const [field, order] = s.startsWith('-') ? [s.slice(1), -1] : [s, 1];
      acc[field] = order;
      return acc;
    }, {}) })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('category', 'name slug icon iconColor gradient');
};

videoSchema.statics.getByCategory = function(categorySlug, options = {}) {
  const { page = 1, limit = 20, sort = '-publishedAt' } = options;
  return this.find({ 
    status: 'published' 
  })
  .populate({
    path: 'category',
    match: { slug: categorySlug },
    select: 'name slug',
  })
  .match({ 'category': { $ne: null } })
  .sort(sort)
  .skip((page - 1) * limit)
  .limit(limit);
};

videoSchema.methods.incrementView = async function(increment = 1) {
  this.viewCount += increment;
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.incrementLike = async function() {
  this.likeCount += 1;
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.decrementLike = async function() {
  this.likeCount = Math.max(0, this.likeCount - 1);
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.incrementDislike = async function() {
  this.dislikeCount += 1;
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.decrementDislike = async function() {
  this.dislikeCount = Math.max(0, this.dislikeCount - 1);
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.incrementComment = async function() {
  this.commentCount += 1;
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.decrementComment = async function() {
  this.commentCount = Math.max(0, this.commentCount - 1);
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.incrementShare = async function() {
  this.shareCount += 1;
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.updateWatchStats = async function(watchTime, videoDuration) {
  this.watchTime += watchTime;
  const totalViews = this.viewCount || 1;
  this.averageWatchTime = this.watchTime / totalViews;
  this.completionRate = Math.min(100, (this.watchTime / (videoDuration * totalViews)) * 100);
  return this.save({ validateBeforeSave: false });
};

videoSchema.methods.getPublicData = function() {
  return {
    id: this._id,
    title: this.title,
    slug: this.slug,
    shortTitle: this.shortTitle,
    description: this.description,
    shortDescription: this.shortDescription,
    category: this.category,
    tags: this.tags,
    status: this.status,
    visibility: this.visibility,
    ageRating: this.ageRating,
    language: this.language,
    subtitles: this.subtitles,
    videoFile: this.videoFile,
    qualities: this.qualities,
    thumbnail: this.thumbnail,
    thumbnails: this.thumbnails,
    previewVideo: this.previewVideo,
    sprite: this.sprite,
    chapters: this.chapters,
    season: this.season,
    episode: this.episode,
    series: this.series,
    viewCount: this.viewCount,
    likeCount: this.likeCount,
    dislikeCount: this.dislikeCount,
    commentCount: this.commentCount,
    shareCount: this.shareCount,
    watchTime: this.watchTime,
    averageWatchTime: this.averageWatchTime,
    completionRate: this.completionRate,
    publishedAt: this.publishedAt,
    isFeatured: this.isFeatured,
    isPremium: this.isPremium,
    isTrending: this.isTrending,
    allowComments: this.allowComments,
    allowEmbedding: this.allowEmbedding,
    allowDownload: this.allowDownload,
    allowRatings: this.allowRatings,
    hlsPlaylistUrl: this.hlsPlaylistUrl,
    dashManifestUrl: this.dashManifestUrl,
    seoTitle: this.seoTitle,
    seoDescription: this.seoDescription,
    seoKeywords: this.seoKeywords,
    canonicalUrl: this.canonicalUrl,
    ogTitle: this.ogTitle,
    ogDescription: this.ogDescription,
    ogImage: this.ogImage,
    ogVideo: this.ogVideo,
    ogVideoWidth: this.ogVideoWidth,
    ogVideoHeight: this.ogVideoHeight,
    twitterCard: this.twitterCard,
    twitterTitle: this.twitterTitle,
    twitterDescription: this.twitterDescription,
    twitterImage: this.twitterImage,
    twitterPlayer: this.twitterPlayer,
    twitterPlayerWidth: this.twitterPlayerWidth,
    twitterPlayerHeight: this.twitterPlayerHeight,
    structuredData: this.structuredData,
    durationFormatted: this.durationFormatted,
    availableQualities: this.availableQualities,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Video = mongoose.model('Video', videoSchema);
export default Video;