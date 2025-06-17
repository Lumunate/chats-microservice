import { SignatureResponse } from '../lib/cloudinary/types/SignatureResponse';

export interface IFileStorageService {
  generateUploadUrl(
    fileName: string,
    fileType: string,
  ): Promise<SignatureResponse>;
  getFileUrl(fileId: string): string;
}
