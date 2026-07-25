import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

const execAsync = promisify(exec);

const QUALITY_CONFIGS = {
  '240p': { width: 426, height: 240, bitrate: '400k', audioBitrate: '64k' },
  '360p': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
  '480p': { width: 854, height: 480, bitrate: '1400k', audioBitrate: '128k' },
  '720p': { width: 1280, height: 720, bitrate: '2800k', audioBitrate: '128k' },
  '1080p': { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
  '1440p': { width: 2560, height: 1440, bitrate: '8000k', audioBitrate: '192k' },
  '2160p': { width: 3840, height: 2160, bitrate: '15000k', audioBitrate: '256k' },
};

const OUTPUT_DIR = path.resolve('./uploads/processed');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(OUTPUT_DIR);

export const getVideoInfo = async (inputPath) => {
  try {
    const ffprobePath = config.ffmpeg.probePath || 'ffprobe';
    const { stdout } = await execAsync(
      `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${inputPath}"`
    );
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to get video info: ${error.message}`);
  }
};

export const getVideoDuration = async (inputPath) => {
  const info = await getVideoInfo(inputPath);
  return parseFloat(info.format?.duration || 0);
};

export const getVideoResolution = async (inputPath) => {
  const info = await getVideoInfo(inputPath);
  const videoStream = info.streams?.find(s => s.codec_type === 'video');
  if (!videoStream) return { width: 0, height: 0 };
  return { width: parseInt(videoStream.width), height: parseInt(videoStream.height) };
};

export const generateThumbnail = async (inputPath, outputPath, time = 10) => {
  try {
    const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
    const timeStr = formatTime(time);
    await execAsync(
      `"${ffmpegPath}" -y -ss ${timeStr} -i "${inputPath}" -vframes 1 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -q:v 2 "${outputPath}"`
    );
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
};

export const generateAutoThumbnails = async (inputPath, outputDir, count = 5) => {
  ensureDir(outputDir);
  const duration = await getVideoDuration(inputPath);
  const interval = Math.max(10, duration / (count + 1));
  const thumbnails = [];
  
  for (let i = 1; i <= count; i++) {
    const time = Math.min(interval * i, duration - 5);
    const outputPath = path.join(outputDir, `thumb_${i}.jpg`);
    await generateThumbnail(inputPath, outputPath, time);
    thumbnails.push({ time: Math.floor(time), url: outputPath });
  }
  
  return thumbnails;
};

export const generateSpriteSheet = async (inputPath, outputDir, interval = 10) => {
  ensureDir(outputDir);
  const duration = await getVideoDuration(inputPath);
  const times = [];
  
  for (let t = 0; t < duration; t += interval) {
    times.push(t);
  }
  
  const cols = Math.ceil(Math.sqrt(times.length));
  const rows = Math.ceil(times.length / cols);
  const thumbWidth = 160;
  const thumbHeight = 90;
  
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  const spritePath = path.join(outputDir, 'sprite.jpg');
  
  const tmpDir = path.join(outputDir, 'tmp_frames');
  ensureDir(tmpDir);
  
  for (let i = 0; i < times.length; i++) {
    const tmpPath = path.join(tmpDir, `frame_${i}.jpg`);
    try {
      await execAsync(
        `"${ffmpegPath}" -y -ss ${formatTime(times[i])} -i "${inputPath}" -vframes 1 -vf "scale=${thumbWidth}:${thumbHeight}" -q:v 5 "${tmpPath}"`
      );
    } catch {}
  }
  
  try {
    const inputs = times.map((_, i) => `-i "${path.join(tmpDir, `frame_${i}.jpg`)}"`).join(' ');
    const filterComplex = times.map((_, i) => `[${i}:v]`).join('') + `xstack=inputs=${times.length}:layout=0_0|${thumbWidth}_0|${thumbWidth*2}_0`;
    await execAsync(
      `"${ffmpegPath}" -y ${inputs} -filter_complex "${filterComplex}" -q:v 2 "${spritePath}"`
    );
  } catch {}
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
  
  return {
    url: spritePath,
    columns: cols,
    rows: rows,
    interval,
    width: thumbWidth,
    height: thumbHeight,
  };
};

export const generatePreview = async (inputPath, outputPath, startTime = 0, duration = 30) => {
  try {
    const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
    await execAsync(
      `"${ffmpegPath}" -y -ss ${formatTime(startTime)} -i "${inputPath}" -t ${duration} -c:v libx264 -preset fast -crf 28 -vf "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2" -c:a aac -b:a 64k -movflags +faststart "${outputPath}"`
    );
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate preview: ${error.message}`);
  }
};

export const generateHLS = async (inputPath, outputDir, qualities = ['240p', '360p', '480p', '720p', '1080p']) => {
  ensureDir(outputDir);
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  const duration = await getVideoDuration(inputPath);
  const info = await getVideoInfo(inputPath);
  const originalWidth = parseInt(info.streams?.find(s => s.codec_type === 'video')?.width || 1920);
  const originalHeight = parseInt(info.streams?.find(s => s.codec_type === 'video')?.height || 1080);
  
  const videoInfo = await getVideoInfo(inputPath);
  const stream = videoInfo.streams?.find(s => s.codec_type === 'video');
  if (!stream) throw new Error('No video stream found');
  
  const inputWidth = parseInt(stream.width);
  const inputHeight = parseInt(stream.height);
  
  const availableQualities = qualities.filter(q => {
    const config = QUALITY_CONFIGS[q];
    return config && config.width <= inputWidth && config.height <= inputHeight;
  });
  
  if (availableQualities.length === 0) {
    availableQualities.push('240p');
  }
  
  let filterComplex = '';
  const inputs = [];
  
  availableQualities.forEach((quality, index) => {
    const config = QUALITY_CONFIGS[quality];
    if (index > 0) filterComplex += `;`;
    filterComplex += `[0:v]scale=${config.width}:${config.height}:force_original_aspect_ratio=decrease,pad=${config.width}:${config.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`;
  });
  
  availableQualities.forEach((quality, index) => {
    inputs.push(`-map "[v${index}]"`);
    inputs.push(`-map 0:a`);
  });
  
  const streamMaps = availableQualities.map((q, i) => `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(QUALITY_CONFIGS[q].bitrate) * 1000},RESOLUTION=${QUALITY_CONFIGS[q].width}x${QUALITY_CONFIGS[q].height}\n${q}/index.m3u8`).join('\n');
  
  const masterPlaylist = `#EXTM3U\n#EXT-X-VERSION:3\n${streamMaps}`;
  
  const masterPath = path.join(outputDir, 'master.m3u8');
  fs.writeFileSync(masterPath, masterPlaylist);
  
  const segmentDuration = 6;
  const baseName = path.basename(inputPath, path.extname(inputPath));
  
  for (const quality of availableQualities) {
    const qualityDir = path.join(outputDir, quality);
    ensureDir(qualityDir);
    
    const config = QUALITY_CONFIGS[quality];
    const videoFilter = `scale=${config.width}:${config.height}:force_original_aspect_ratio=decrease,pad=${config.width}:${config.height}:(ow-iw)/2:(oh-ih)/2`;
    
    await execAsync(
      `"${ffmpegPath}" -y -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -b:v ${config.bitrate} -vf "${videoFilter}" -c:a aac -b:a ${config.audioBitrate} -hls_time ${segmentDuration} -hls_list_size 0 -hls_segment_filename "${qualityDir}/segment_%03d.ts" -master_pl_name master.m3u8 "${qualityDir}/index.m3u8" 2>/dev/null`
    ).catch(() => {});
  }
  
  return {
    masterPlaylist: masterPath,
    qualities: availableQualities,
  };
};

export const generateDASH = async (inputPath, outputDir, qualities = ['240p', '360p', '480p', '720p', '1080p']) => {
  ensureDir(outputDir);
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  
  const info = await getVideoInfo(inputPath);
  const stream = info.streams?.find(s => s.codec_type === 'video');
  if (!stream) throw new Error('No video stream found');
  
  const inputWidth = parseInt(stream.width);
  const inputHeight = parseInt(stream.height);
  
  const availableQualities = qualities.filter(q => {
    const cfg = QUALITY_CONFIGS[q];
    return cfg && cfg.width <= inputWidth && cfg.height <= inputHeight;
  });
  
  if (availableQualities.length === 0) availableQualities.push('240p');
  
  let filterComplex = '';
  availableQualities.forEach((quality, index) => {
    const config = QUALITY_CONFIGS[quality];
    if (index > 0) filterComplex += ';';
    filterComplex += `[0:v]scale=${config.width}:${config.height}:force_original_aspect_ratio=decrease,pad=${config.width}:${config.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`;
  });
  
  const streamMaps = availableQualities.map((_, i) => `[v${i}][0:a]`).join('');
  
  try {
    await execAsync(
      `"${ffmpegPath}" -y -i "${inputPath}" -filter_complex "${filterComplex}" ${streamMaps} -map ${availableQualities.map((_, i) => `[v${i}]`).join(' ')} -map 0:a -b:v ${availableQualities.map(q => QUALITY_CONFIGS[q].bitrate).join(' ')} -b:a ${QUALITY_CONFIGS[availableQualities.length - 1].audioBitrate} -c:v libx264 -preset fast -c:a aac -seg_duration 6 -init_seg_name 'init-\$RepresentationID\$.m4s' -media_seg_name 'chunk-\$RepresentationID\$-\$Number%05d\$.m4s' -f dash "${outputDir}/manifest.mpd" 2>/dev/null`
    ).catch(() => {});
  } catch {}
  
  return {
    manifest: path.join(outputDir, 'manifest.mpd'),
    qualities: availableQualities,
  };
};

export const compressVideo = async (inputPath, outputPath, quality = '720p') => {
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  const config = QUALITY_CONFIGS[quality] || QUALITY_CONFIGS['720p'];
  
  await execAsync(
    `"${ffmpegPath}" -y -i "${inputPath}" -c:v libx264 -preset medium -crf 23 -vf "scale=${config.width}:${config.height}:force_original_aspect_ratio=decrease,pad=${config.width}:${config.height}:(ow-iw)/2:(oh-ih)/2" -c:a aac -b:a ${config.audioBitrate} -movflags +faststart "${outputPath}"`
  );
  
  return outputPath;
};

export const transcodeVideo = async (inputPath, outputPath, options = {}) => {
  const { quality = '720p', codec = 'libx264', preset = 'medium', crf = 23 } = options;
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  const qConfig = QUALITY_CONFIGS[quality] || QUALITY_CONFIGS['720p'];
  
  let command = `"${ffmpegPath}" -y -i "${inputPath}" -c:v ${codec} -preset ${preset} -crf ${crf}`;
  command += ` -vf "scale=${qConfig.width}:${qConfig.height}:force_original_aspect_ratio=decrease,pad=${qConfig.width}:${qConfig.height}:(ow-iw)/2:(oh-ih)/2"`;
  command += ` -c:a aac -b:a ${qConfig.audioBitrate}`;
  command += ` -movflags +faststart "${outputPath}"`;
  
  await execAsync(command);
  return outputPath;
};

export const extractAudio = async (inputPath, outputPath) => {
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  await execAsync(
    `"${ffmpegPath}" -y -i "${inputPath}" -vn -c:a aac -b:a 128k "${outputPath}"`
  );
  return outputPath;
};

export const getVideoMetadata = async (inputPath) => {
  const info = await getVideoInfo(inputPath);
  const videoStream = info.streams?.find(s => s.codec_type === 'video');
  const audioStream = info.streams?.find(s => s.codec_type === 'audio');
  
  return {
    duration: parseFloat(info.format?.duration || 0),
    size: parseInt(info.format?.size || 0),
    format: info.format?.format_name,
    bitRate: parseInt(info.format?.bit_rate || 0),
    width: parseInt(videoStream?.width || 0),
    height: parseInt(videoStream?.height || 0),
    codec: videoStream?.codec_name,
    fps: (() => { const r = videoStream?.r_frame_rate || '0'; const [n, d] = r.split('/').map(Number); return (d && d !== 0) ? n / d : (parseFloat(r) || 0); })(),
    audioCodec: audioStream?.codec_name,
    audioBitRate: parseInt(audioStream?.bit_rate || 0),
    audioSampleRate: parseInt(audioStream?.sample_rate || 0),
    title: info.format?.tags?.title,
    artist: info.format?.tags?.artist,
    album: info.format?.tags?.album,
    year: info.format?.tags?.date,
    genre: info.format?.tags?.genre,
    comment: info.format?.tags?.comment,
    encoder: info.format?.tags?.encoder,
    creationTime: info.format?.tags?.creation_time,
  };
};

export const addWatermark = async (inputPath, watermarkPath, outputPath) => {
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  await execAsync(
    `"${ffmpegPath}" -y -i "${inputPath}" -i "${watermarkPath}" -filter_complex "overlay=W-w-10:H-h-10" "${outputPath}"`
  );
  return outputPath;
};

export const removeAudio = async (inputPath, outputPath) => {
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  await execAsync(
    `"${ffmpegPath}" -y -i "${inputPath}" -an -c:v copy "${outputPath}"`
  );
  return outputPath;
};

export const normalizeAudio = async (inputPath, outputPath) => {
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  await execAsync(
    `"${ffmpegPath}" -y -i "${inputPath}" -af "loudnorm=I=-16:TP=-1.5:LRA=11" "${outputPath}"`
  );
  return outputPath;
};

export const generateSubtitles = async (inputPath, outputPath, language = 'en') => {
  const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
  try {
    await execAsync(
      `"${ffmpegPath}" -y -i "${inputPath}" -ac 1 -ar 16000 "${outputPath.replace(/\.[^.]+$/, '.wav')}"`
    );
  } catch {}
  return outputPath;
};

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`;
};

export const processVideoFile = async (videoId, inputPath, options = {}) => {
  const {
    generateThumbnails = true,
    generatePreview = true,
    generateHLSStream = true,
    generateDASHStream = true,
    generateSpriteSheet: genSprite = true,
    qualities = ['240p', '360p', '480p', '720p', '1080p'],
  } = options;
  
  const outputDir = path.join(OUTPUT_DIR, videoId);
  ensureDir(outputDir);
  
  const metadata = await getVideoMetadata(inputPath);
  const result = { metadata, qualities: [], thumbnails: [], sprite: null, preview: null, hls: null, dash: null };
  
  for (const quality of qualities) {
    const qConfig = QUALITY_CONFIGS[quality];
    if (!qConfig) continue;
    if (metadata.width < qConfig.width && metadata.height < qConfig.height) continue;
    
    const qualityDir = path.join(outputDir, quality);
    ensureDir(qualityDir);
    const outputPath = path.join(qualityDir, `video_${quality}.mp4`);
    
    try {
      await transcodeVideo(inputPath, outputPath, { quality, crf: quality === '1080p' ? 20 : 23 });
      const stat = fs.statSync(outputPath);
      result.qualities.push({
        quality,
        url: outputPath,
        width: qConfig.width,
        height: qConfig.height,
        bitrate: qConfig.bitrate,
        size: stat.size,
        codec: 'libx264',
      });
    } catch (error) {
      console.error(`Failed to transcode ${quality}:`, error.message);
    }
  }
  
  if (generateThumbnails) {
    const thumbDir = path.join(outputDir, 'thumbnails');
    ensureDir(thumbDir);
    try {
      const mainThumb = path.join(thumbDir, 'thumbnail.jpg');
      await generateThumbnail(inputPath, mainThumb, Math.min(10, metadata.duration / 2));
      result.thumbnail = mainThumb;
      
      const autoThumbs = await generateAutoThumbnails(inputPath, thumbDir, 8);
      result.thumbnails = autoThumbs;
    } catch (error) {
      console.error('Failed to generate thumbnails:', error.message);
    }
  }
  
  if (genSprite) {
    const spriteDir = path.join(outputDir, 'sprite');
    ensureDir(spriteDir);
    try {
      result.sprite = await generateSpriteSheet(inputPath, spriteDir, 10);
    } catch (error) {
      console.error('Failed to generate sprite sheet:', error.message);
    }
  }
  
  if (generatePreview) {
    const previewDir = path.join(outputDir, 'preview');
    ensureDir(previewDir);
    try {
      const previewPath = path.join(previewDir, 'preview.mp4');
      const startTime = Math.max(0, metadata.duration / 2 - 15);
      await generatePreview(inputPath, previewPath, startTime, 30);
      result.preview = { url: previewPath, duration: 30, startTime };
    } catch (error) {
      console.error('Failed to generate preview:', error.message);
    }
  }
  
  if (generateHLSStream) {
    const hlsDir = path.join(outputDir, 'hls');
    ensureDir(hlsDir);
    try {
      const availableQualities = result.qualities.map(q => q.quality);
      result.hls = await generateHLS(inputPath, hlsDir, availableQualities);
    } catch (error) {
      console.error('Failed to generate HLS:', error.message);
    }
  }
  
  if (generateDASHStream) {
    const dashDir = path.join(outputDir, 'dash');
    ensureDir(dashDir);
    try {
      const availableQualities = result.qualities.map(q => q.quality);
      result.dash = await generateDASH(inputPath, dashDir, availableQualities);
    } catch (error) {
      console.error('Failed to generate DASH:', error.message);
    }
  }
  
  return result;
};