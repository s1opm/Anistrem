import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

const seriesSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Series title is required'],
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
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters'],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  thumbnail: {
    type: String,
  },
  banner: {
    type: String,
  },
  bannerMobile: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'unlisted', 'archived'],
    default: 'draft',
    index: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'subscribers', 'premium'],
    default: 'public',
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isOngoing: {
    type: Boolean,
    default: true,
  },
  releaseYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 5,
  },
  endYear: {
    type: Number,
    min: 1900,
  },
  ageRating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
    default: 'G',
  },
  language: {
    type: String,
    default: 'en',
    maxlength: 10,
  },
  originalLanguage: {
    type: String,
    default: 'en',
    maxlength: 10,
  },
  country: {
    type: String,
    maxlength: 2,
  },
  studio: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  genres: [{
    type: String,
    trim: true,
  }],
  seasonCount: {
    type: Number,
    default: 0,
  },
  episodeCount: {
    type: Number,
    default: 0,
  },
  totalDuration: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  cast: [{
    name: String,
    role: String,
    character: String,
    image: String,
    order: Number,
  }],
  crew: [{
    name: String,
    role: String,
    department: String,
    order: Number,
  }],
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
  ogTitle: String,
  ogDescription: String,
  ogImage: String,
  twitterCard: {
    type: String,
    enum: ['summary', 'summary_large_image'],
    default: 'summary_large_image',
  },
  twitterTitle: String,
  twitterDescription: String,
  twitterImage: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

seriesSchema.index({ title: 'text', description: 'text', tags: 'text' });
seriesSchema.index({ category: 1, status: 1 });
seriesSchema.index({ isFeatured: 1, status: 1 });
seriesSchema.index({ isOngoing: 1, status: 1 });
seriesSchema.index({ releaseYear: -1 });
seriesSchema.index({ viewCount: -1 });
seriesSchema.index({ 'rating.average': -1 });
seriesSchema.index({ createdAt: -1 });

seriesSchema.virtual('seasons', {
  ref: 'Season',
  localField: '_id',
  foreignField: 'series',
});

seriesSchema.virtual('episodes', {
  ref: 'Video',
  localField: '_id',
  foreignField: 'series',
});

seriesSchema.virtual('durationFormatted').get(function() {
  if (!this.totalDuration) return '0:00';
  const hrs = Math.floor(this.totalDuration / 3600);
  const mins = Math.floor((this.totalDuration % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
});

seriesSchema.pre('validate', function(next) {
  if (this.isNew && this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

seriesSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

seriesSchema.methods.incrementView = async function() {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

seriesSchema.methods.incrementLike = async function() {
  this.likeCount += 1;
  return this.save({ validateBeforeSave: false });
};

seriesSchema.methods.updateStats = async function() {
  const Video = this.model('Video');
  const stats = await Video.aggregate([
    { $match: { series: this._id, status: 'published' } },
    {
      $group: {
        _id: null,
        episodeCount: { $sum: 1 },
        totalDuration: { $sum: '$videoFile.duration' },
        viewCount: { $sum: '$viewCount' },
        likeCount: { $sum: '$likeCount' },
        seasons: { $addToSet: '$season' },
      },
    },
  ]);
  
  if (stats.length > 0) {
    this.episodeCount = stats[0].episodeCount;
    this.totalDuration = stats[0].totalDuration;
    this.viewCount = stats[0].viewCount;
    this.likeCount = stats[0].likeCount;
    this.seasonCount = stats[0].seasons.length;
  }
  
  return this.save({ validateBeforeSave: false });
};

seriesSchema.statics.getPublished = function() {
  return this.find({ status: 'published', visibility: 'public' });
};

seriesSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ status: 'published', visibility: 'public', isFeatured: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('category', 'name slug icon iconColor gradient');
};

seriesSchema.statics.getOngoing = function(limit = 10) {
  return this.find({ status: 'published', visibility: 'public', isOngoing: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('category', 'name slug icon iconColor gradient');
};

seriesSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: 'published', visibility: 'public' })
    .sort({ viewCount: -1, 'rating.average': -1 })
    .limit(limit)
    .populate('category', 'name slug icon iconColor gradient');
};

export const Series = mongoose.model('Series', seriesSchema);
export default Series;