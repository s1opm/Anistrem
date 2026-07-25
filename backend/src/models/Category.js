import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
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
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  icon: {
    type: String,
  },
  iconColor: {
    type: String,
    default: '#6366f1',
  },
  gradient: {
    type: String,
    default: 'from-indigo-500 to-purple-600',
  },
  thumbnail: {
    type: String,
  },
  thumbnailWidth: Number,
  thumbnailHeight: Number,
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  showOnHomepage: {
    type: Boolean,
    default: false,
  },
  homepageOrder: {
    type: Number,
    default: 0,
  },
  videoCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
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

categorySchema.index({ parent: 1, order: 1 });
categorySchema.index({ isActive: 1, order: 1 });
categorySchema.index({ isFeatured: 1, isActive: 1 });

categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

categorySchema.virtual('videos', {
  ref: 'Video',
  localField: '_id',
  foreignField: 'category',
});

categorySchema.virtual('fullPath').get(function() {
  if (!this.parent) return this.name;
  if (this.populated('parent') && this.parent?.name) {
    return `${this.parent.name} > ${this.name}`;
  }
  return this.name;
});

categorySchema.pre('validate', function(next) {
  if (this.isNew && this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

categorySchema.statics.getTree = function() {
  return this.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();
};

categorySchema.statics.getRootCategories = function() {
  return this.find({ parent: null, isActive: true })
    .sort({ order: 1, name: 1 });
};

categorySchema.statics.getFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .sort({ order: 1, name: 1 })
    .limit(limit);
};

categorySchema.statics.getHomepageCategories = function() {
  return this.find({ showOnHomepage: true, isActive: true })
    .sort({ homepageOrder: 1, name: 1 })
    .populate('children', 'name slug icon iconColor gradient videoCount');
};

categorySchema.methods.incrementVideoCount = async function() {
  this.videoCount += 1;
  return this.save({ validateBeforeSave: false });
};

categorySchema.methods.decrementVideoCount = async function() {
  this.videoCount = Math.max(0, this.videoCount - 1);
  return this.save({ validateBeforeSave: false });
};

categorySchema.methods.incrementViewCount = async function(count = 1) {
  this.viewCount += count;
  return this.save({ validateBeforeSave: false });
};

export const Category = mongoose.model('Category', categorySchema);
export default Category;