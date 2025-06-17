import { IFileStorageService } from './interfaces/IFileStorageService';
import CloudinaryService from './lib/cloudinary';

export function getStorageService(): IFileStorageService {
  return new CloudinaryService();
}

export default getStorageService();
