import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

const playlistSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Playlist title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
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
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  videos: [{
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'unlisted', 'archived'],
    default: 'draft',
    index: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'subscribers'],
    default: 'public',
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isCollaborative: {
    type: Boolean,
    default: false,
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'Admin',
  }],
  thumbnail: {
    type: String,
  },
  autoThumbnail: {
    type: Boolean,
    default: true,
  },
  videoCount: {
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
  shareCount: {
    type: Number,
    default: 0,
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

playlistSchema.index({ title: 'text', description: 'text', tags: 'text' });
playlistSchema.index({ category: 1, status: 1, createdAt: -1 });
playlistSchema.index({ isFeatured: 1, status: 1, createdAt: -1 });
playlistSchema.index({ createdBy: 1, status: 1 });

playlistSchema.virtual('durationFormatted').get(function() {
  if (!this.totalDuration) return '0:00';
  const hrs = Math.floor(this.totalDuration / 3600);
  const mins = Math.floor((this.totalDuration % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
});

playlistSchema.pre('validate', function(next) {
  if (this.isNew && this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

playlistSchema.pre('save', function(next) {
  this.videoCount = this.videos.length;
  this.totalDuration = 0;
  if (this.isModified('title') && !this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

playlistSchema.methods.addVideo = async function(videoId, adminId) {
  const exists = this.videos.some(v => v.video.toString() === videoId.toString());
  if (!exists) {
    this.videos.push({ video: videoId, order: this.videos.length, addedBy: adminId });
    this.videoCount = this.videos.length;
  }
  return this.save({ validateBeforeSave: false });
};

playlistSchema.methods.removeVideo = async function(videoId) {
  this.videos = this.videos.filter(v => v.video.toString() !== videoId.toString());
  this.videos.forEach((v, i) => { v.order = i; });
  this.videoCount = this.videos.length;
  return this.save({ validateBeforeSave: false });
};

playlistSchema.methods.reorderVideos = async function(videoOrders) {
  videoOrders.forEach(({ videoId, order }) => {
    const video = this.videos.find(v => v.video.toString() === videoId.toString());
    if (video) video.order = order;
  });
  this.videos.sort((a, b) => a.order - b.order);
  this.videos.forEach((v, i) => { v.order = i; });
  return this.save({ validateBeforeSave: false });
};

playlistSchema.methods.incrementView = async function() {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

playlistSchema.statics.getPublished = function() {
  return this.find({ status: 'published', visibility: 'public' });
};

playlistSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ status: 'published', visibility: 'public', isFeatured: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name')
    .populate('videos.video', 'title slug thumbnail duration');
};

export const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;