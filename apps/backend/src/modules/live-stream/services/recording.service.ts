import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../../infra/s3/s3.service';
import { PrismaService } from '../../../infra/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

interface RecordingProcess {
  process: ChildProcess | null;
  inputPath: string;
  outputPath: string;
  startTime: Date;
  writeStream: fs.WriteStream | null;
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
   * Kayıt başlat - WebSocket üzerinden gelen ses verisini toplar
   */
  async startRecording(streamId: string): Promise<void> {
    if (this.activeRecordings.has(streamId)) {
      this.logger.warn(`Recording already active for stream: ${streamId}`);
      return;
    }

    const inputPath = path.join(this.tempDir, `${streamId}.webm`);
    const outputPath = path.join(this.tempDir, `${streamId}.mp3`);

    this.logger.log(`Creating recording files at: ${inputPath}`);

    // WebM verisini yazmak için stream aç
    const writeStream = fs.createWriteStream(inputPath);

    writeStream.on('error', (err) => {
      this.logger.error(`WriteStream error for ${streamId}: ${err.message}`);
    });

    this.activeRecordings.set(streamId, {
      process: null,
      inputPath,
      outputPath,
      startTime: new Date(),
      writeStream,
    });

    this.logger.log(`Recording started (collecting audio): ${streamId}, path: ${inputPath}`);
  }

  /**
   * WebSocket'ten gelen ses verisini kaydet
   */
  writeAudioChunk(streamId: string, audioBuffer: Buffer): void {
    const recording = this.activeRecordings.get(streamId);
    if (!recording || !recording.writeStream) {
      this.logger.warn(`No active recording for ${streamId}, cannot write audio chunk`);
      return;
    }

    try {
      recording.writeStream.write(audioBuffer);
      this.logger.debug(`Wrote ${audioBuffer.length} bytes to recording ${streamId}`);
    } catch (error) {
      this.logger.error(`Failed to write audio chunk [${streamId}]: ${error}`);
    }
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

    const duration = Math.floor(
      (Date.now() - recording.startTime.getTime()) / 1000,
    );

    // WriteStream'i kapat
    if (recording.writeStream) {
      await new Promise<void>((resolve) => {
        recording.writeStream!.end(() => resolve());
      });
    }

    // WebM dosyası var mı kontrol et
    if (!fs.existsSync(recording.inputPath)) {
      this.logger.warn(`Input file not found: ${recording.inputPath}`);
      this.activeRecordings.delete(streamId);
      return { cdnUrl: '', path: '', duration };
    }

    const inputStats = fs.statSync(recording.inputPath);
    if (inputStats.size < 1000) {
      this.logger.warn(`Input file too small (${inputStats.size} bytes): ${recording.inputPath}`);
      fs.unlinkSync(recording.inputPath);
      this.activeRecordings.delete(streamId);
      return { cdnUrl: '', path: '', duration };
    }

    this.logger.log(`Converting WebM to MP3: ${recording.inputPath} (${inputStats.size} bytes)`);

    // FFmpeg ile WebM'i MP3'e dönüştür
    try {
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-y',
          '-i', recording.inputPath,
          '-c:a', 'libmp3lame',
          '-b:a', '128k',
          '-ar', '44100',
          '-ac', '2',
          recording.outputPath,
        ]);

        ffmpeg.stderr.on('data', (data) => {
          this.logger.debug(`FFmpeg [${streamId}]: ${data}`);
        });

        ffmpeg.on('error', (err) => {
          this.logger.error(`FFmpeg error [${streamId}]: ${err.message}`);
          reject(err);
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });
      });
    } catch (error) {
      this.logger.error(`FFmpeg conversion failed [${streamId}]: ${error}`);
      // WebM dosyasını temizle
      if (fs.existsSync(recording.inputPath)) {
        fs.unlinkSync(recording.inputPath);
      }
      this.activeRecordings.delete(streamId);
      return { cdnUrl: '', path: '', duration };
    }

    const remotePath = `recordings/${streamId}.mp3`;
    let cdnUrl = '';

    // S3'e yükle
    if (fs.existsSync(recording.outputPath)) {
      try {
        const buffer = fs.readFileSync(recording.outputPath);
        await this.s3.putObject(remotePath, buffer, 'audio/mpeg');
        cdnUrl = this.getCdnUrl(remotePath);

        // Local dosyaları sil
        fs.unlinkSync(recording.outputPath);
        if (fs.existsSync(recording.inputPath)) {
          fs.unlinkSync(recording.inputPath);
        }

        this.logger.log(`Recording uploaded: ${streamId} → ${cdnUrl} (${duration}s)`);
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
