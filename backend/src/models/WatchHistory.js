import mongoose, { Schema } from 'mongoose';

const watchHistorySchema = new Schema({
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
  progress: {
    type: Number,
    default: 0,
    min: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
  watchedPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  quality: {
    type: String,
  },
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'tv', 'other'],
    default: 'other',
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  events: [{
    type: {
      type: String,
      enum: ['play', 'pause', 'seek', 'quality_change', 'fullscreen', 'pip', 'speed_change', 'volume_change', 'subtitle_change', 'chapter_change', 'buffer_start', 'buffer_end', 'error', 'complete'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    data: Schema.Types.Mixed,
  }],
  sessionId: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });
watchHistorySchema.index({ user: 1, createdAt: -1 });
watchHistorySchema.index({ user: 1, updatedAt: -1 });
watchHistorySchema.index({ video: 1, updatedAt: -1 });

watchHistorySchema.virtual('formattedProgress').get(function() {
  if (this.duration <= 0) return '0:00';
  const hours = Math.floor(this.progress / 3600);
  const minutes = Math.floor((this.progress % 3600) / 60);
  const seconds = Math.floor(this.progress % 60);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

watchHistorySchema.virtual('remainingTime').get(function() {
  if (this.duration <= 0 || this.progress >= this.duration) return '0:00';
  const remaining = this.duration - this.progress;
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

watchHistorySchema.methods.updateProgress = async function(progress, duration, events = []) {
  this.progress = Math.max(0, Math.min(progress, duration));
  this.duration = duration;
  this.watchedPercentage = duration > 0 ? Math.min(100, (this.progress / duration) * 100) : 0;
  this.completed = this.watchedPercentage >= 90;
  
  if (events.length > 0) {
    this.events.push(...events);
  }
  
  return this.save({ validateBeforeSave: false });
};

watchHistorySchema.statics.getUserHistory = function(userId, options = {}) {
  const { page = 1, limit = 20, filter = 'all', sort = '-updatedAt' } = options;
  const query = { user: userId };
  
  if (filter === 'continue') query.completed = false;
  if (filter === 'completed') query.completed = true;
  
  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('video', 'title slug thumbnail duration videoFile.duration category status isPremium')
    .populate('video.category', 'name slug icon iconColor gradient');
};

watchHistorySchema.statics.getContinueWatching = function(userId, limit = 10) {
  return this.find({ user: userId, completed: false, progress: { $gt: 10 } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('video', 'title slug thumbnail duration videoFile.duration category isPremium')
    .populate('video.category', 'name slug icon iconColor gradient');
};

watchHistorySchema.statics.getRecentlyWatched = function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('video', 'title slug thumbnail duration videoFile.duration category status')
    .populate('video.category', 'name slug icon iconColor gradient');
};

watchHistorySchema.statics.clearUserHistory = function(userId, videoId = null) {
  const query = { user: userId };
  if (videoId) query.video = videoId;
  return this.deleteMany(query);
};

watchHistorySchema.statics.getVideoStats = function(videoId) {
  return this.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        completedViews: { $sum: { $cond: ['$completed', 1, 0] } },
        avgProgress: { $avg: '$watchedPercentage' },
        avgDuration: { $avg: '$progress' },
        uniqueUsers: { $addToSet: '$user' },
      },
    },
    {
      $project: {
        totalViews: 1,
        completedViews: 1,
        completionRate: { $divide: ['$completedViews', '$totalViews'] },
        avgProgress: 1,
        avgDuration: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
      },
    },
  ]);
};

export const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);
export default WatchHistory;