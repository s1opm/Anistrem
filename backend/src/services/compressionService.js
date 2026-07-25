import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';

const execFileAsync = promisify(execFile);

const ffmpegPath = config.ffmpeg.path || 'ffmpeg';
const ffprobePath = config.ffmpeg.ffprobePath || 'ffprobe';
const MAX_SIZE_BYTES = 45 * 1024 * 1024;

export async function getVideoInfo(filePath) {
  try {
    const { stdout } = await execFileAsync(ffprobePath, [
      '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath,
    ]);
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

export async function compressVideo(inputPath) {
  const info = await getVideoInfo(inputPath);
  if (!info) return inputPath;

  const size = parseInt(info.format?.size || '0', 10);
  if (size <= MAX_SIZE_BYTES) return inputPath;

  const outputPath = inputPath.replace(/(\.[^.]+)$/, '_compressed$1');
  const duration = parseFloat(info.format?.duration || '0');
  if (!duration) return inputPath;

  const targetBitrate = Math.floor((MAX_SIZE_BYTES * 8) / duration * 0.9);
  const videoBitrate = Math.max(100000, Math.floor(targetBitrate * 0.85));
  const audioBitrate = Math.max(32000, targetBitrate - videoBitrate);
  const maxHeight = 480;

  const args = [
    '-y', '-i', inputPath,
    '-c:v', 'libx264', '-preset', 'fast',
    '-b:v', `${videoBitrate}`,
    '-vf', `scale=-2:min(${maxHeight},ih)`,
    '-c:a', 'aac', '-b:a', `${audioBitrate}`,
    '-movflags', '+faststart',
    '-max_muxing_queue_size', '1024',
    outputPath,
  ];

  try {
    await execFileAsync(ffmpegPath, args, { timeout: 300000 });
    const newInfo = await getVideoInfo(outputPath);
    const newSize = parseInt(newInfo?.format?.size || '0', 10);

    if (newSize > 0 && newSize < size) {
      await fs.unlink(inputPath).catch(() => {});
      return outputPath;
    }

    await fs.unlink(outputPath).catch(() => {});
    return inputPath;
  } catch {
    await fs.unlink(outputPath).catch(() => {});
    return inputPath;
  }
}
