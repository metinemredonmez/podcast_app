import { BadRequestException } from '@nestjs/common';
import {
  FileCategory,
  ALLOWED_FILE_TYPES,
  detectFileCategoryByExtension,
  detectFileCategoryByMimeType,
} from '../constants/file-types';

export interface FileValidationResult {
  valid: boolean;
  category?: FileCategory;
  errors: string[];
}

export class FileValidator {
  /**
   * Validate file against allowed types, sizes, and magic numbers
   */
  static validate(file: Express.Multer.File, expectedCategory?: FileCategory): FileValidationResult {
    const errors: string[] = [];

    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File is required and cannot be empty.');
    }

    // Detect file category
    const categoryByExt = detectFileCategoryByExtension(file.originalname);
    const categoryByMime = detectFileCategoryByMimeType(file.mimetype);

    // If expected category is provided, validate against it
    if (expectedCategory) {
      if (categoryByExt !== expectedCategory && categoryByMime !== expectedCategory) {
        errors.push(
          `File type not allowed for ${expectedCategory}. Expected: ${ALLOWED_FILE_TYPES[expectedCategory].extensions.join(', ')}`,
        );
      }
    }

    // Determine the category to use for validation
    const category = categoryByExt || categoryByMime;

    if (!category) {
      errors.push(
        `File type not allowed. Allowed extensions: ${this.getAllowedExtensionsString()}`,
      );
      return { valid: false, errors };
    }

    const config = ALLOWED_FILE_TYPES[category];

    // Validate extension
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext && !config.extensions.includes(ext)) {
      errors.push(
        `Invalid file extension .${ext}. Allowed: ${config.extensions.join(', ')}`,
      );
    }

    // Validate MIME type
    if (!config.mimeTypes.includes(file.mimetype.toLowerCase())) {
      errors.push(
        `Invalid MIME type ${file.mimetype}. Allowed: ${config.mimeTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > config.maxSize) {
      errors.push(
        `File size ${this.formatBytes(file.size)} exceeds maximum allowed size ${this.formatBytes(config.maxSize)}`,
      );
    }

    // Validate magic numbers (file signature)
    if (config.magicNumbers && config.magicNumbers.length > 0) {
      const hasValidSignature = this.validateMagicNumbers(file.buffer, config.magicNumbers);
      if (!hasValidSignature) {
        errors.push(
          `File signature validation failed. The file may be corrupted or not a valid ${category} file.`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      category,
      errors,
    };
  }

  /**
   * Validate magic numbers (file signatures)
   */
  private static validateMagicNumbers(
    buffer: Buffer,
    magicNumbers: { offset: number; bytes: number[] }[],
  ): boolean {
    return magicNumbers.some((magic) => {
      if (buffer.length < magic.offset + magic.bytes.length) {
        return false;
      }

      return magic.bytes.every((byte, index) => {
        return buffer[magic.offset + index] === byte;
      });
    });
  }

  /**
   * Format bytes to human-readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get all allowed extensions as a string
   */
  private static getAllowedExtensionsString(): string {
    const allExtensions = Object.values(ALLOWED_FILE_TYPES).flatMap(
      (config) => config.extensions,
    );
    return allExtensions.join(', ');
  }

  /**
   * Validate and throw if invalid
   */
  static validateOrThrow(file: Express.Multer.File, expectedCategory?: FileCategory): FileCategory {
    const result = this.validate(file, expectedCategory);

    if (!result.valid) {
      throw new BadRequestException({
        message: 'File validation failed',
        errors: result.errors,
      });
    }

    return result.category!;
  }

  /**
   * Check if file is an audio file
   */
  static isAudio(file: Express.Multer.File): boolean {
    const result = this.validate(file, FileCategory.AUDIO);
    return result.valid;
  }

  /**
   * Check if file is an image file
   */
  static isImage(file: Express.Multer.File): boolean {
    const result = this.validate(file, FileCategory.IMAGE);
    return result.valid;
  }

  /**
   * Get file category without validation
   */
  static getFileCategory(file: Express.Multer.File): FileCategory | null {
    return (
      detectFileCategoryByExtension(file.originalname) ||
      detectFileCategoryByMimeType(file.mimetype)
    );
  }
}
