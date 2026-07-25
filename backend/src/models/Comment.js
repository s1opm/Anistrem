import mongoose, { Schema } from 'mongoose';

const commentSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    index: true,
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [5000, 'Comment cannot exceed 5000 characters'],
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  likeCount: {
    type: Number,
    default: 0,
  },
  dislikeCount: {
    type: Number,
    default: 0,
  },
  replyCount: {
    type: Number,
    default: 0,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isHighlighted: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['published', 'pending', 'hidden', 'deleted', 'spam'],
    default: 'published',
    index: true,
  },
  moderationNote: {
    type: String,
  },
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
  },
  moderatedAt: {
    type: Date,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

commentSchema.index({ video: 1, parentComment: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ video: 1, status: 1, likeCount: -1, createdAt: -1 });
commentSchema.index({ status: 1, createdAt: -1 });

commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
});

commentSchema.virtual('isTopLevel').get(function() {
  return !this.parentComment;
});

commentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

commentSchema.methods.incrementLikes = async function() {
  this.likeCount += 1;
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.decrementLikes = async function() {
  this.likeCount = Math.max(0, this.likeCount - 1);
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.incrementDislikes = async function() {
  this.dislikeCount += 1;
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.decrementDislikes = async function() {
  this.dislikeCount = Math.max(0, this.dislikeCount - 1);
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.incrementReplies = async function() {
  this.replyCount += 1;
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.decrementReplies = async function() {
  this.replyCount = Math.max(0, this.replyCount - 1);
  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.getPublicData = function(currentUserId = null) {
  return {
    id: this._id,
    video: this.video,
    user: this.user,
    parentComment: this.parentComment,
    content: this.content,
    mentions: this.mentions,
    likeCount: this.likeCount,
    dislikeCount: this.dislikeCount,
    replyCount: this.replyCount,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    isPinned: this.isPinned,
    isHighlighted: this.isHighlighted,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

commentSchema.statics.getVideoComments = function(videoId, options = {}) {
  const { page = 1, limit = 20, sort = '-createdAt', parentComment = null, userId } = options;
  const query = { video: videoId, status: 'published' };
  
  if (parentComment) {
    query.parentComment = parentComment;
  } else {
    query.parentComment = { $exists: false };
  }
  
  return this.find(query)
    .populate('user', 'username displayName avatar isVerified')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

commentSchema.statics.getCommentReplies = function(commentId, options = {}) {
  const { page = 1, limit = 10, sort = 'createdAt' } = options;
  return this.find({ parentComment: commentId, status: 'published' })
    .populate('user', 'username displayName avatar isVerified')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

commentSchema.statics.getUserComments = function(userId, options = {}) {
  const { page = 1, limit = 20, sort = '-createdAt' } = options;
  return this.find({ user: userId, status: 'published' })
    .populate('video', 'title slug thumbnail')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

commentSchema.statics.getCommentThread = async function(commentId, maxDepth = 3) {
  const comment = await this.findById(commentId)
    .populate('user', 'username displayName avatar isVerified')
    .lean();
  
  if (!comment) return null;
  
  const buildThread = async (parentId, depth) => {
    if (depth >= maxDepth) return [];
    
    const replies = await this.find({ parentComment: parentId, status: 'published' })
      .populate('user', 'username displayName avatar isVerified')
      .sort('createdAt')
      .lean();
    
    for (const reply of replies) {
      reply.replies = await buildThread(reply._id, depth + 1);
    }
    
    return replies;
  };
  
  comment.replies = await buildThread(commentId, 0);
  return comment;
};

export const Comment = mongoose.model('Comment', commentSchema);
export default Comment;