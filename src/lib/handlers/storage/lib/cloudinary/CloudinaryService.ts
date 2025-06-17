import { v2 as cloudinary } from 'cloudinary';

import cloudinaryConfig from './config';
import { SignatureResponse } from './types/SignatureResponse';
import { IFileStorageService } from '../../interfaces/IFileStorageService';

export class CloudinaryService implements IFileStorageService {
  constructor() {
    cloudinary.config(cloudinaryConfig);
  }

  /**
   * Generates a presigned URL for direct file upload to Cloudinary
   * @param fileName The name of the file to be uploaded
   * @param _fileType The MIME type of the file
   * @returns An object containing the upload URL and any required parameters
   */
  async generateUploadUrl(
    _fileType: string,
  ): Promise<SignatureResponse> {
    // Generate a timestamp in seconds
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const params = {
      timestamp,
    };

    // Generate the signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      cloudinaryConfig.api_secret || '',
    );

    return {
      signature,
      timestamp,
      apiKey: cloudinaryConfig.api_key,
      cloudName: cloudinaryConfig.cloud_name,
    };
  }

  /**
   * Returns the URL for accessing a file
   * @param fileId The public ID or path of the file in Cloudinary
   * @returns The complete URL to access the file
   */
  getFileUrl(fileId: string): string {
    return cloudinary.url(fileId, {
      secure: true,
      resource_type: 'auto',
    });
  }
}