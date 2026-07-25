import mongoose, { Schema } from 'mongoose';

const videoViewSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  sessionId: {
    type: String,
    index: true,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  country: {
    type: String,
    maxlength: 2,
  },
  region: {
    type: String,
  },
  city: {
    type: String,
  },
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'tv', 'other'],
    default: 'other',
  },
  os: {
    type: String,
  },
  browser: {
    type: String,
  },
  referrer: {
    type: String,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number,
    default: 0,
  },
  videoDuration: {
    type: Number,
    default: 0,
  },
  watchedPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  quality: {
    type: String,
  },
  isComplete: {
    type: Boolean,
    default: false,
  },
  isUnique: {
    type: Boolean,
    default: true,
  },
  events: [{
    type: {
      type: String,
      enum: ['play', 'pause', 'seek', 'quality_change', 'fullscreen', 'pip', 'speed_change', 'volume_change', 'subtitle_change', 'chapter_change', 'buffer_start', 'buffer_end', 'error', 'complete'],
    },
    time: {
      type: Number,
    },
    data: Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

videoViewSchema.index({ video: 1, startTime: -1 });
videoViewSchema.index({ user: 1, video: 1, startTime: -1 });
videoViewSchema.index({ sessionId: 1, video: 1 });
videoViewSchema.index({ ip: 1, video: 1, startTime: -1 });
videoViewSchema.index({ country: 1, startTime: -1 });
videoViewSchema.index({ device: 1, startTime: -1 });
videoViewSchema.index({ isUnique: 1, video: 1, startTime: -1 });

videoViewSchema.statics.recordView = async function(data) {
  const { video, user, sessionId, ip, userAgent, country, region, city, device, os, browser, referrer, videoDuration, quality } = data;
  
  let view = await this.findOne({
    video,
    $or: [
      { user },
      { sessionId },
      { ip, userAgent },
    ],
    startTime: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
  }).sort({ startTime: -1 });
  
  if (view) {
    view.endTime = new Date();
    view.duration = Math.floor((view.endTime - view.startTime) / 1000);
    view.watchedPercentage = Math.min(100, (view.duration / videoDuration) * 100);
    view.isComplete = view.watchedPercentage >= 90;
    view.quality = quality || view.quality;
    return view.save();
  }
  
  view = new this({
    video,
    user,
    sessionId,
    ip,
    userAgent,
    country,
    region,
    city,
    device,
    os,
    browser,
    referrer,
    videoDuration,
    quality,
  });
  
  await view.save();
  
  await this.model('Video').findByIdAndUpdate(video, {
    $inc: { viewCount: 1 },
  });
  
  return view;
};

videoViewSchema.statics.recordEvent = async function(viewId, event) {
  return this.findByIdAndUpdate(viewId, {
    $push: { events: { ...event, timestamp: new Date() } },
  }, { new: true });
};

videoViewSchema.statics.getVideoStats = async function(videoId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [totalViews, uniqueViews, avgWatchTime, completionRate, viewsByDay, viewsByCountry, viewsByDevice, viewsByQuality] = await Promise.all([
    this.countDocuments({ video: videoId, startTime: { $gte: startDate } }),
    this.countDocuments({ video: videoId, isUnique: true, startTime: { $gte: startDate } }),
    this.aggregate([
      { $match: { video: new mongoose.Types.ObjectId(videoId), startTime: { $gte: startDate } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]),
    this.aggregate([
      { $match: { video: new mongoose.Types.ObjectId(videoId), isComplete: true, startTime: { $gte: startDate } } },
      { $count: 'count' },
    ]),
    this.aggregate([
      { $match: { video: new mongoose.Types.ObjectId(videoId), startTime: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    this.aggregate([
      { $match: { video: new mongoose.Types.ObjectId(videoId), startTime: { $gte: startDate } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    this.aggregate([
      { $match: { video: new mongoose.Types.ObjectId(videoId), startTime: { $gte: startDate } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $match: { video: new mongoose.Types.ObjectId(videoId), startTime: { $gte: startDate } } },
      { $group: { _id: '$quality', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  
  return {
    totalViews,
    uniqueViews,
    avgWatchTime: avgWatchTime[0]?.avgDuration || 0,
    completionRate: completionRate[0]?.count ? (completionRate[0].count / uniqueViews) * 100 : 0,
    viewsByDay,
    viewsByCountry,
    viewsByDevice,
    viewsByQuality,
  };
};

videoViewSchema.statics.getGlobalStats = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [totalViews, uniqueViews, avgWatchTime, viewsByDay, topCountries, topDevices, topBrowsers] = await Promise.all([
    this.countDocuments({ startTime: { $gte: startDate } }),
    this.countDocuments({ isUnique: true, startTime: { $gte: startDate } }),
    this.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]),
    this.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    this.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    this.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);
  
  return {
    totalViews,
    uniqueViews,
    avgWatchTime: avgWatchTime[0]?.avgDuration || 0,
    viewsByDay,
    topCountries,
    topDevices,
    topBrowsers,
  };
};

export const VideoView = mongoose.model('VideoView', videoViewSchema);
export default VideoView;