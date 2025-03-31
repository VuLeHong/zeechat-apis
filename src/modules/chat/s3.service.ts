import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
  private readonly ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
    'text/xml',
    'application/zip',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadImage(file: Express.Multer.File, key: string) {
    // Input validation
    if (!file) {
      throw new BadRequestException('No image provided');
    }
    if (!key) {
      throw new BadRequestException('Image key is required');
    }

    // File size validation
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`Image size exceeds limit of 10 MB`);
    }

    // Content type validation
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid image type: ${file.mimetype}. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`);
    }

    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('S3 bucket name not configured');
    }

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as ObjectCannedACL, // Public read for images
    };

    try {
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      const imageUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;
      return {
        url: imageUrl,
        key,
      };
    } catch (error) {
      if (error.name === 'NoSuchBucket') {
        throw new Error('S3 bucket does not exist');
      } else if (error.name === 'AccessDenied') {
        throw new Error('Insufficient permissions to upload to S3');
      }
      throw new Error(`Failed to upload image to S3: ${error.message}`);
    }
  }

  async uploadFile(file: Express.Multer.File, key: string) {
    // Input validation
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    // File size validation
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Content type validation
    if (!this.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}`);
    }

    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('S3 bucket name not configured');
    }

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: `attachment; filename="${key}"`, // Forces download
      ACL: 'public-read' as ObjectCannedACL,
    };

    try {
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // For private files, you might want to generate a presigned URL if needed
      const downloadUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;
      return {
        url: downloadUrl, // Note: This URL might require authentication based on bucket policy
        key,
      };
    } catch (error) {
      if (error.name === 'NoSuchBucket') {
        throw new Error('S3 bucket does not exist');
      } else if (error.name === 'AccessDenied') {
        throw new Error('Insufficient permissions to upload to S3');
      }
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }
}