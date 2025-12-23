import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../../infra/s3/s3.service';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

interface EncoderProcess {
  process: ChildProcess;
  inputPath: string;
  outputDir: string;
}

@Injectable()
export class HlsGeneratorService implements OnModuleDestroy {
  private readonly logger = new Logger(HlsGeneratorService.name);
  private readonly tempDir: string;
  private readonly cdnUrl: string;
  private readonly activeEncoders: Map<string, EncoderProcess> = new Map();
  private readonly uploadIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly config: ConfigService,
    private readonly s3: S3Service,
  ) {
    this.tempDir = this.config.get<string>('TEMP_DIR', '/tmp/streams');
    this.cdnUrl =
      this.config.get<string>('CDN_URL') ||
      this.config.get<string>('S3_PUBLIC_URL') ||
      '';

    // Temp dizini oluştur
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * CDN URL oluştur
   */
  getCdnUrl(hlsPath: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${hlsPath}`;
    }
    // Fallback to S3 signed URL
    return hlsPath;
  }

  /**
   * Stream için HLS output dizini hazırla
   */
  async prepareStreamDirectory(streamId: string): Promise<string> {
    const streamDir = path.join(this.tempDir, streamId);

    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }

    return streamDir;
  }

  /**
   * FFmpeg ile ses encoding başlat
   * WebM audio → HLS (AAC)
   */
  async startEncoding(streamId: string): Promise<void> {
    const streamDir = await this.prepareStreamDirectory(streamId);
    const inputPath = path.join(streamDir, 'input.fifo');
    const outputPath = path.join(streamDir, 'live.m3u8');

    // Named pipe oluştur (FIFO) - ses verisi buraya yazılacak
    if (!fs.existsSync(inputPath)) {
      try {
        // macOS/Linux'ta mkfifo kullan
        const mkfifo = spawn('mkfifo', [inputPath]);
        await new Promise<void>((resolve, reject) => {
          mkfifo.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`mkfifo failed with code ${code}`));
          });
        });
      } catch {
        // Fallback: normal dosya kullan
        fs.writeFileSync(inputPath, '');
      }
    }

    // FFmpeg process başlat
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f',
      'webm',
      '-i',
      inputPath,
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-ac',
      '2',
      '-f',
      'hls',
      '-hls_time',
      '4', // 4 saniyelik segment
      '-hls_list_size',
      '10', // Son 10 segment playlist'te
      '-hls_flags',
      'delete_segments+append_list+omit_endlist',
      '-hls_segment_filename',
      path.join(streamDir, 'segment_%03d.ts'),
      outputPath,
    ]);

    ffmpeg.stderr.on('data', (data) => {
      this.logger.debug(`FFmpeg [${streamId}]: ${data}`);
    });

    ffmpeg.on('error', (err) => {
      this.logger.error(`FFmpeg error [${streamId}]: ${err.message}`);
    });

    ffmpeg.on('close', (code) => {
      this.logger.log(`FFmpeg closed [${streamId}] with code ${code}`);
      this.activeEncoders.delete(streamId);
    });

    this.activeEncoders.set(streamId, {
      process: ffmpeg,
      inputPath,
      outputDir: streamDir,
    });

    // Periyodik olarak segment'leri CDN'e yükle
    this.startSegmentUpload(streamId, streamDir);

    this.logger.log(`HLS encoding started for stream: ${streamId}`);
  }

  /**
   * Ses verisini encoder'a gönder
   */
  async writeAudioData(streamId: string, audioBuffer: Buffer): Promise<void> {
    const encoder = this.activeEncoders.get(streamId);
    if (!encoder) {
      this.logger.warn(`No encoder found for stream: ${streamId}`);
      return;
    }

    try {
      // Ses verisini input dosyasına yaz
      fs.appendFileSync(encoder.inputPath, audioBuffer);
    } catch (error) {
      this.logger.error(`Failed to write audio data: ${error}`);
    }
  }

  /**
   * Segment'leri periyodik olarak S3/CDN'e yükle
   */
  private startSegmentUpload(streamId: string, streamDir: string): void {
    const uploadedSegments = new Set<string>();

    const interval = setInterval(async () => {
      try {
        const files = fs.readdirSync(streamDir);

        for (const file of files) {
          const filePath = path.join(streamDir, file);

          // Sadece .ts ve .m3u8 dosyalarını yükle
          if (!file.endsWith('.ts') && !file.endsWith('.m3u8')) continue;

          // Zaten yüklendiyse atla (playlist hariç)
          if (file.endsWith('.ts') && uploadedSegments.has(file)) continue;

          const remotePath = `streams/${streamId}/${file}`;
          const contentType = file.endsWith('.m3u8')
            ? 'application/vnd.apple.mpegurl'
            : 'video/MP2T';

          try {
            const buffer = fs.readFileSync(filePath);
            await this.s3.putObject(remotePath, buffer, contentType);

            if (file.endsWith('.ts')) {
              uploadedSegments.add(file);
            }
          } catch (uploadError) {
            this.logger.error(
              `Failed to upload ${file}: ${uploadError}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Segment upload error: ${error}`);
      }
    }, 2000); // Her 2 saniyede kontrol et

    this.uploadIntervals.set(streamId, interval);
  }

  /**
   * Encoding durdur
   */
  stopEncoding(streamId: string): void {
    // Upload interval'ı durdur
    const interval = this.uploadIntervals.get(streamId);
    if (interval) {
      clearInterval(interval);
      this.uploadIntervals.delete(streamId);
    }

    // FFmpeg'i durdur
    const encoder = this.activeEncoders.get(streamId);
    if (encoder) {
      encoder.process.kill('SIGTERM');
      this.activeEncoders.delete(streamId);
      this.logger.log(`HLS encoding stopped for stream: ${streamId}`);
    }
  }

  /**
   * Stream temizliği
   */
  async cleanup(streamId: string): Promise<void> {
    this.stopEncoding(streamId);

    // Local dosyaları sil
    const streamDir = path.join(this.tempDir, streamId);
    if (fs.existsSync(streamDir)) {
      fs.rmSync(streamDir, { recursive: true });
    }

    // S3'ten HLS dosyalarını sil
    try {
      const client = this.s3.getClient();
      const bucket = this.s3.getBucket();
      const prefix = `streams/${streamId}/`;

      const objectsStream = client.listObjects(bucket, prefix, true);
      const objects: string[] = [];

      for await (const obj of objectsStream) {
        if (obj.name) {
          objects.push(obj.name);
        }
      }

      for (const key of objects) {
        await this.s3.deleteObject(key);
      }

      this.logger.log(`Cleanup completed for stream: ${streamId}`);
    } catch (error) {
      this.logger.error(`Cleanup error for stream ${streamId}: ${error}`);
    }
  }

  /**
   * HLS endpoint'ini döndür (CDN veya S3)
   */
  getHlsUrl(streamId: string): string {
    const hlsPath = `streams/${streamId}/live.m3u8`;
    return this.getCdnUrl(hlsPath);
  }

  /**
   * Module destroy - tüm encoding'leri durdur
   */
  onModuleDestroy(): void {
    for (const streamId of this.activeEncoders.keys()) {
      this.stopEncoding(streamId);
    }
  }
}
