import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../../infra/s3/s3.service';
import { PrismaService } from '../../../infra/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

interface RecordingProcess {
  process: ChildProcess;
  outputPath: string;
  startTime: Date;
}

interface RecordingResult {
  cdnUrl: string;
  path: string;
  duration: number;
}

@Injectable()
export class RecordingService implements OnModuleDestroy {
  private readonly logger = new Logger(RecordingService.name);
  private readonly tempDir: string;
  private readonly cdnUrl: string;
  private readonly activeRecordings: Map<string, RecordingProcess> = new Map();

  constructor(
    private readonly config: ConfigService,
    private readonly s3: S3Service,
    private readonly prisma: PrismaService,
  ) {
    this.tempDir = this.config.get<string>('TEMP_DIR', '/tmp/recordings');
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
   * Kayıt başlat
   */
  async startRecording(streamId: string): Promise<void> {
    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream?.hlsUrl) {
      this.logger.error(`HLS URL bulunamadı: ${streamId}`);
      return;
    }

    const outputPath = path.join(this.tempDir, `${streamId}.mp3`);

    // FFmpeg ile HLS'i MP3'e kaydet
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i',
      stream.hlsUrl,
      '-c:a',
      'libmp3lame',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-ac',
      '2',
      outputPath,
    ]);

    ffmpeg.stderr.on('data', (data) => {
      this.logger.debug(`Recording FFmpeg [${streamId}]: ${data}`);
    });

    ffmpeg.on('error', (err) => {
      this.logger.error(`Recording error [${streamId}]: ${err.message}`);
    });

    ffmpeg.on('close', (code) => {
      this.logger.log(`Recording FFmpeg closed [${streamId}] with code ${code}`);
    });

    this.activeRecordings.set(streamId, {
      process: ffmpeg,
      outputPath,
      startTime: new Date(),
    });

    this.logger.log(`Recording started: ${streamId}`);
  }

  /**
   * Kayıt durdur ve S3'e yükle
   */
  async stopRecording(streamId: string): Promise<RecordingResult> {
    const recording = this.activeRecordings.get(streamId);

    if (!recording) {
      this.logger.warn(`Aktif kayıt bulunamadı: ${streamId}`);
      return { cdnUrl: '', path: '', duration: 0 };
    }

    // FFmpeg'i durdur
    recording.process.kill('SIGTERM');

    // İşlemin bitmesini bekle
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const remotePath = `recordings/${streamId}.mp3`;
    let cdnUrl = '';
    const duration = Math.floor(
      (Date.now() - recording.startTime.getTime()) / 1000,
    );

    // S3'e yükle
    if (fs.existsSync(recording.outputPath)) {
      try {
        const buffer = fs.readFileSync(recording.outputPath);
        await this.s3.putObject(remotePath, buffer, 'audio/mpeg');
        cdnUrl = this.getCdnUrl(remotePath);

        // Local dosyayı sil
        fs.unlinkSync(recording.outputPath);

        this.logger.log(`Recording uploaded: ${streamId} → ${cdnUrl}`);
      } catch (error) {
        this.logger.error(`Recording upload error [${streamId}]: ${error}`);
      }
    } else {
      this.logger.warn(`Recording file not found: ${recording.outputPath}`);
    }

    this.activeRecordings.delete(streamId);

    return { cdnUrl, path: remotePath, duration };
  }

  /**
   * CDN URL oluştur
   */
  private getCdnUrl(recordingPath: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${recordingPath}`;
    }
    return recordingPath;
  }

  /**
   * Kayıt dosyasını sil
   */
  async deleteRecording(streamId: string): Promise<void> {
    const remotePath = `recordings/${streamId}.mp3`;

    try {
      await this.s3.deleteObject(remotePath);
      this.logger.log(`Recording deleted: ${streamId}`);
    } catch (error) {
      this.logger.error(`Recording delete error [${streamId}]: ${error}`);
    }
  }

  /**
   * Aktif kayıt var mı kontrol et
   */
  isRecording(streamId: string): boolean {
    return this.activeRecordings.has(streamId);
  }

  /**
   * Module destroy - tüm kayıtları durdur
   */
  async onModuleDestroy(): Promise<void> {
    for (const streamId of this.activeRecordings.keys()) {
      await this.stopRecording(streamId);
    }
  }
}
