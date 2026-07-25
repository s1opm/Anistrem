import mongoose, { Schema } from 'mongoose';

const favoriteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    index: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
  }],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  watched: {
    type: Boolean,
    default: false,
  },
  watchedAt: {
    type: Date,
  },
  priority: {
    type: Number,
    default: 0,
    min: -10,
    max: 10,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

favoriteSchema.index({ user: 1, video: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });
favoriteSchema.index({ user: 1, priority: -1, createdAt: -1 });
favoriteSchema.index({ video: 1, createdAt: -1 });

favoriteSchema.methods.markWatched = async function() {
  this.watched = true;
  this.watchedAt = new Date();
  return this.save({ validateBeforeSave: false });
};

favoriteSchema.methods.markUnwatched = async function() {
  this.watched = false;
  this.watchedAt = null;
  return this.save({ validateBeforeSave: false });
};

favoriteSchema.statics.getUserFavorites = function(userId, options = {}) {
  const { page = 1, limit = 20, sort = '-createdAt', filter = 'all', category, tags } = options;
  const query = { user: userId };
  
  if (filter === 'watched') query.watched = true;
  if (filter === 'unwatched') query.watched = false;
  if (category) query.category = category;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  
  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('video', 'title slug thumbnail duration videoFile.duration category status isPremium publishedAt viewCount likeCount')
    .populate('video.category', 'name slug icon iconColor gradient')
    .populate('category', 'name slug icon iconColor gradient');
};

favoriteSchema.statics.isFavorite = function(userId, videoId) {
  return this.exists({ user: userId, video: videoId });
};

favoriteSchema.statics.getUserFavoriteIds = function(userId) {
  return this.find({ user: userId }).select('video').lean();
};

favoriteSchema.statics.getVideoFavoritedBy = function(videoId) {
  return this.countDocuments({ video: videoId });
};

favoriteSchema.statics.toggleFavorite = async function(userId, videoId) {
  const existing = await this.findOne({ user: userId, video: videoId });
  if (existing) {
    await existing.deleteOne();
    return { favorited: false, favorite: null };
  }
  
  const favorite = await this.create({ user: userId, video: videoId });
  return { favorited: true, favorite };
};

favoriteSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        watched: { $sum: { $cond: ['$watched', 1, 0] } },
        unwatched: { $sum: { $cond: ['$watched', 0, 1] } },
        byCategory: { $push: '$category' },
      },
    },
  ]);
};

export const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;