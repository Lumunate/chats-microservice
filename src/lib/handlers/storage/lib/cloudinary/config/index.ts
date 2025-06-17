const CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string;
const CLOUDINARY_CLOUD_NAME = process.env
  .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET as string;

if (!CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary environment variables are not properly defined');
}

const cloudinaryConfig = {
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
};

export default cloudinaryConfig;
