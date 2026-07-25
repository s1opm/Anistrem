import mongoose, { Schema } from 'mongoose';

const seasonSchema = new Schema({
  series: {
    type: Schema.Types.ObjectId,
    ref: 'Series',
    required: true,
    index: true,
  },
  seasonNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
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
  thumbnail: {
    type: String,
  },
  banner: {
    type: String,
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
  releaseDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'unlisted', 'archived'],
    default: 'draft',
    index: true,
  },
  isReleased: {
    type: Boolean,
    default: false,
  },
  order: {
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

seasonSchema.index({ series: 1, seasonNumber: 1 }, { unique: true });
seasonSchema.index({ series: 1, status: 1, order: 1 });
seasonSchema.index({ series: 1, isReleased: 1 });

seasonSchema.virtual('episodes', {
  ref: 'Video',
  localField: '_id',
  foreignField: 'season',
  justOne: false,
});

seasonSchema.virtual('durationFormatted').get(function() {
  if (!this.totalDuration) return '0:00';
  const hrs = Math.floor(this.totalDuration / 3600);
  const mins = Math.floor((this.totalDuration % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
});

seasonSchema.pre('save', async function(next) {
  if (this.isModified('releaseDate') && this.releaseDate <= new Date()) {
    this.isReleased = true;
  }
  next();
});

seasonSchema.methods.updateStats = async function() {
  const Video = this.model('Video');
  const stats = await Video.aggregate([
    { $match: { season: this._id, status: 'published' } },
    {
      $group: {
        _id: null,
        episodeCount: { $sum: 1 },
        totalDuration: { $sum: '$videoFile.duration' },
        viewCount: { $sum: '$viewCount' },
      },
    },
  ]);
  
  if (stats.length > 0) {
    this.episodeCount = stats[0].episodeCount;
    this.totalDuration = stats[0].totalDuration;
    this.viewCount = stats[0].viewCount;
  }
  
  return this.save({ validateBeforeSave: false });
};

seasonSchema.statics.getBySeries = function(seriesId, status = 'published') {
  return this.find({ series: seriesId, status })
    .sort({ seasonNumber: 1 })
    .populate('episodes', 'title slug episode thumbnail duration videoFile.duration status');
};

export const Season = mongoose.model('Season', seasonSchema);
export default Season;