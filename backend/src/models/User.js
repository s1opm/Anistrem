import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    index: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters'],
  },
  avatar: {
    type: String,
  },
  avatarPublicId: {
    type: String,
  },
  banner: {
    type: String,
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
  },
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website URL cannot exceed 200 characters'],
  },
  birthDate: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  },
  role: {
    type: String,
    enum: ['user', 'premium', 'moderator', 'admin', 'superadmin'],
    default: 'user',
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned', 'pending_verification'],
    default: 'active',
    index: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  lastLogin: {
    type: Date,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lockUntil: {
    type: Date,
    select: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  twoFactorBackupCodes: [{
    type: String,
    select: false,
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      default: 'en',
    },
    autoplay: {
      type: Boolean,
      default: true,
    },
    autoplayNext: {
      type: Boolean,
      default: true,
    },
    videoQuality: {
      type: String,
      enum: ['auto', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'],
      default: 'auto',
    },
    playbackSpeed: {
      type: Number,
      default: 1,
      min: 0.25,
      max: 2,
    },
    captionsEnabled: {
      type: Boolean,
      default: false,
    },
    captionLanguage: {
      type: String,
      default: 'en',
    },
    captionSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    captionStyle: {
      type: String,
      enum: ['default', 'outline', 'shadow', 'highlight'],
      default: 'default',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    newVideoNotifications: {
      type: Boolean,
      default: true,
    },
    commentNotifications: {
      type: Boolean,
      default: true,
    },
    replyNotifications: {
      type: Boolean,
      default: true,
    },
    likeNotifications: {
      type: Boolean,
      default: true,
    },
    subscriptionNotifications: {
      type: Boolean,
      default: true,
    },
    liveStreamNotifications: {
      type: Boolean,
      default: true,
    },
    newsletter: {
      type: Boolean,
      default: false,
    },
    adultContent: {
      type: Boolean,
      default: false,
    },
    watchHistory: {
      type: Boolean,
      default: true,
    },
    watchLater: {
      type: Boolean,
      default: true,
    },
  },
  socialLinks: {
    youtube: String,
    twitter: String,
    instagram: String,
    facebook: String,
    discord: String,
    tiktok: String,
    reddit: String,
    github: String,
    twitch: String,
    patreon: String,
  },
  stats: {
    videosWatched: {
      type: Number,
      default: 0,
    },
    totalWatchTime: {
      type: Number,
      default: 0,
    },
    videosLiked: {
      type: Number,
      default: 0,
    },
    videosDisliked: {
      type: Number,
      default: 0,
    },
    commentsPosted: {
      type: Number,
      default: 0,
    },
    playlistsCreated: {
      type: Number,
      default: 0,
    },
    favoritesCount: {
      type: Number,
      default: 0,
    },
    subscribersCount: {
      type: Number,
      default: 0,
    },
    subscriptionsCount: {
      type: Number,
      default: 0,
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'premium_plus', 'family'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete'],
      default: 'active',
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    stripePriceId: {
      type: String,
    },
  },
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  mutedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  followedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  sessions: [{
    token: {
      type: String,
      select: false,
    },
    device: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    ip: {
      type: String,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActive: -1 });

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('fullName').get(function() {
  return this.displayName || this.username;
});

userSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birth = new Date(this.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 },
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

userSchema.methods.createSession = function(token, deviceInfo, expiresAt) {
  this.sessions.push({
    token,
    device: deviceInfo.device,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    ip: deviceInfo.ip,
    country: deviceInfo.country,
    city: deviceInfo.city,
    expiresAt,
  });
  
  if (this.sessions.length > 10) {
    this.sessions = this.sessions.slice(-10);
  }
  
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.removeSession = function(token) {
  this.sessions = this.sessions.filter(s => s.token !== token);
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.removeAllSessions = function() {
  this.sessions = [];
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    banner: this.banner,
    bio: this.bio,
    location: this.location,
    website: this.website,
    isVerified: this.isVerified,
    role: this.role,
    stats: this.stats,
    socialLinks: this.socialLinks,
    createdAt: this.createdAt,
    followersCount: this.followers.length,
    followingCount: this.followedUsers.length,
  };
};

userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
    ],
  }).select('+password');
};

userSchema.statics.searchUsers = function(query, options = {}) {
  const { page = 1, limit = 20, excludeUserId } = options;
  const searchQuery = {
    $and: [
      { status: 'active' },
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } },
        ],
      },
    ],
  };
  
  if (excludeUserId) {
    searchQuery.$and.push({ _id: { $ne: excludeUserId } });
  }
  
  return this.find(searchQuery)
    .select('username displayName avatar isVerified stats.subscribersCount')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ 'stats.subscribersCount': -1, createdAt: -1 });
};

export const User = mongoose.model('User', userSchema);
export default User;