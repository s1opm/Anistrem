import mongoose, { Schema } from 'mongoose';

const siteSettingsSchema = new Schema({
  siteName: {
    type: String,
    default: 'AniStrem',
    maxlength: 100,
  },
  siteDescription: {
    type: String,
    default: 'Your premier destination for animation streaming',
    maxlength: 300,
  },
  siteUrl: {
    type: String,
    default: 'https://anistrem.com',
  },
  logo: {
    type: String,
  },
  logoDark: {
    type: String,
  },
  favicon: {
    type: String,
  },
  primaryColor: {
    type: String,
    default: '#6366f1',
  },
  secondaryColor: {
    type: String,
    default: '#8b5cf6',
  },
  accentColor: {
    type: String,
    default: '#f43f5e',
  },
  backgroundColor: {
    type: String,
    default: '#0f0f0f',
  },
  textColor: {
    type: String,
    default: '#ffffff',
  },
  fontFamily: {
    type: String,
    default: 'Inter, system-ui, sans-serif',
  },
  heroBanner: {
    title: {
      type: String,
      default: 'Welcome to AniStrem',
    },
    subtitle: {
      type: String,
      default: 'Discover amazing animated content from around the world',
    },
    backgroundImage: String,
    videoId: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
    ctaText: {
      type: String,
      default: 'Watch Now',
    },
    ctaLink: {
      type: String,
      default: '/videos',
    },
  },
  featuredCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category',
  }],
  featuredVideos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video',
  }],
  trendingVideos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video',
  }],
  latestVideos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video',
  }],
  mostViewedVideos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video',
  }],
  socialLinks: {
    youtube: String,
    twitter: String,
    instagram: String,
    facebook: String,
    discord: String,
    tiktok: String,
    reddit: String,
    github: String,
  },
  contactEmail: {
    type: String,
    default: 'contact@anistrem.com',
  },
  supportEmail: {
    type: String,
    default: 'support@anistrem.com',
  },
  copyrightText: {
    type: String,
    default: '© 2024 AniStrem. All rights reserved.',
  },
  privacyPolicyUrl: String,
  termsOfServiceUrl: String,
  dmcaUrl: String,
  cookiePolicyUrl: String,
  adsenseClientId: String,
  adsenseSlots: {
    header: String,
    sidebar: String,
    betweenVideos: String,
    belowPlayer: String,
    footer: String,
  },
  adSettings: {
    showAds: {
      type: Boolean,
      default: false,
    },
    showOnPremium: {
      type: Boolean,
      default: false,
    },
    maxAdsPerPage: {
      type: Number,
      default: 3,
    },
    autoAds: {
      type: Boolean,
      default: false,
    },
  },
  analytics: {
    googleAnalyticsId: String,
    googleTagManagerId: String,
    facebookPixelId: String,
    customHeadScript: String,
    customBodyScript: String,
  },
  seo: {
    defaultTitle: String,
    defaultDescription: String,
    defaultKeywords: [String],
    defaultOgImage: String,
    robotsTxt: String,
    sitemapEnabled: {
      type: Boolean,
      default: true,
    },
  },
  video: {
    maxUploadSize: {
      type: Number,
      default: 524288000,
    },
    allowedFormats: [String],
    defaultQuality: {
      type: String,
      default: '720p',
    },
    generateThumbnails: {
      type: Boolean,
      default: true,
    },
    generatePreview: {
      type: Boolean,
      default: true,
    },
    previewDuration: {
      type: Number,
      default: 30,
    },
    generateSprite: {
      type: Boolean,
      default: true,
    },
    generateHLS: {
      type: Boolean,
      default: true,
    },
    generateDASH: {
      type: Boolean,
      default: true,
    },
    autoPublish: {
      type: Boolean,
      default: false,
    },
    defaultVisibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public',
    },
    defaultAgeRating: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
      default: 'G',
    },
    defaultLanguage: {
      type: String,
      default: 'en',
    },
    enableComments: {
      type: Boolean,
      default: true,
    },
    enableRatings: {
      type: Boolean,
      default: true,
    },
    enableEmbedding: {
      type: Boolean,
      default: true,
    },
    enableDownload: {
      type: Boolean,
      default: false,
    },
  },
  player: {
    autoPlay: {
      type: Boolean,
      default: false,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    loop: {
      type: Boolean,
      default: false,
    },
    showControls: {
      type: Boolean,
      default: true,
    },
    enablePIP: {
      type: Boolean,
      default: true,
    },
    enableFullscreen: {
      type: Boolean,
      default: true,
    },
    enableSpeedControl: {
      type: Boolean,
      default: true,
    },
    enableQualitySelection: {
      type: Boolean,
      default: true,
    },
    enableChapters: {
      type: Boolean,
      default: true,
    },
    enableSubtitles: {
      type: Boolean,
      default: true,
    },
    defaultSubtitleLanguage: {
      type: String,
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['dark', 'light', 'auto'],
      default: 'dark',
    },
    accentColor: {
      type: String,
      default: '#6366f1',
    },
  },
  upload: {
    storage: {
      type: String,
      enum: ['local', 's3', 'cloudinary', 'gcs'],
      default: 'local',
    },
    localPath: {
      type: String,
      default: './uploads',
    },
    s3Bucket: String,
    s3Region: String,
    s3AccessKey: String,
    s3SecretKey: String,
    cloudinaryCloudName: String,
    cloudinaryApiKey: String,
    cloudinaryApiSecret: String,
    cdnUrl: String,
  },
  email: {
    host: String,
    port: Number,
    secure: Boolean,
    user: String,
    pass: String,
    from: String,
    templates: {
      welcome: String,
      verification: String,
      passwordReset: String,
      notification: String,
    },
  },
  security: {
    corsOrigin: String,
    rateLimitWindow: {
      type: Number,
      default: 900000,
    },
    rateLimitMax: {
      type: Number,
      default: 100,
    },
    jwtExpiry: {
      type: String,
      default: '15m',
    },
    jwtRefreshExpiry: {
      type: String,
      default: '7d',
    },
    passwordMinLength: {
      type: Number,
      default: 8,
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
    },
    lockoutDuration: {
      type: Number,
      default: 7200000,
    },
    sessionTimeout: {
      type: Number,
      default: 86400000,
    },
    enableTwoFactor: {
      type: Boolean,
      default: false,
    },
    allowedOrigins: [String],
  },
  maintenance: {
    enabled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: 'We are currently performing scheduled maintenance. Please check back later.',
    },
    allowedIPs: [String],
  },
  registration: {
    enabled: {
      type: Boolean,
      default: true,
    },
    requireVerification: {
      type: Boolean,
      default: false,
    },
    defaultRole: {
      type: String,
      enum: ['user', 'premium', 'admin'],
      default: 'user',
    },
    allowedDomains: [String],
    blockedDomains: [String],
  },
  comments: {
    enabled: {
      type: Boolean,
      default: true,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    maxLength: {
      type: Number,
      default: 2000,
    },
    allowLinks: {
      type: Boolean,
      default: false,
    },
    allowMarkdown: {
      type: Boolean,
      default: false,
    },
    nestedReplies: {
      type: Number,
      default: 3,
    },
  },
  cache: {
    enabled: {
      type: Boolean,
      default: true,
    },
    ttl: {
      type: Number,
      default: 3600,
    },
    redisUrl: String,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
});

siteSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne().populate('featuredCategories featuredVideos trendingVideos latestVideos mostViewedVideos heroBanner.videoId');
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

siteSettingsSchema.methods.getPublicSettings = function() {
  return {
    siteName: this.siteName,
    siteDescription: this.siteDescription,
    siteUrl: this.siteUrl,
    logo: this.logo,
    logoDark: this.logoDark,
    favicon: this.favicon,
    primaryColor: this.primaryColor,
    secondaryColor: this.secondaryColor,
    accentColor: this.accentColor,
    backgroundColor: this.backgroundColor,
    textColor: this.textColor,
    fontFamily: this.fontFamily,
    heroBanner: this.heroBanner,
    featuredCategories: this.featuredCategories,
    featuredVideos: this.featuredVideos,
    trendingVideos: this.trendingVideos,
    latestVideos: this.latestVideos,
    mostViewedVideos: this.mostViewedVideos,
    socialLinks: this.socialLinks,
    contactEmail: this.contactEmail,
    supportEmail: this.supportEmail,
    copyrightText: this.copyrightText,
    privacyPolicyUrl: this.privacyPolicyUrl,
    termsOfServiceUrl: this.termsOfServiceUrl,
    dmcaUrl: this.dmcaUrl,
    cookiePolicyUrl: this.cookiePolicyUrl,
    adsenseClientId: this.adsenseClientId,
    adsenseSlots: this.adsenseSlots,
    adSettings: this.adSettings,
    analytics: this.analytics,
    seo: this.seo,
    video: this.video,
    player: this.player,
    comments: this.comments,
    maintenance: this.maintenance,
  };
};

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;