# FFmpeg Setup for Vercel Deployment

## Important Note

FFmpeg is **not available by default** on Vercel serverless functions. The current implementation will work locally but may fail on Vercel unless FFmpeg is properly bundled.

## Options for Production

### Option 1: Use a Video Processing Service (Recommended)
Instead of running FFmpeg directly, use a service like:
- **Cloudinary** - Video transformation API
- **AWS MediaConvert** - Serverless video processing
- **Mux** - Video API with clip generation
- **Replicate** - AI models that can process videos

### Option 2: Bundle FFmpeg Binary
If you need FFmpeg on Vercel, you can:
1. Download FFmpeg static binary for Linux
2. Include it in your project
3. Reference it via `FFMPEG_PATH` environment variable

Example:
```bash
# Download FFmpeg static binary
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
# Copy ffmpeg binary to your project
```

Then set in Vercel environment variables:
```
FFMPEG_PATH=/var/task/ffmpeg
```

### Option 3: Use Vercel Edge Functions with External Service
Use Vercel Edge Functions to call an external video processing API instead of running FFmpeg directly.

## Current Implementation

The code currently:
- Uses `/tmp` directory (writable in Vercel serverless functions)
- Attempts to call FFmpeg via `exec`
- Falls back gracefully if FFmpeg is not available

## Testing Locally

FFmpeg must be installed and in your PATH:
```bash
# Check if FFmpeg is installed
ffmpeg -version

# If not installed:
# macOS: brew install ffmpeg
# Ubuntu: sudo apt-get install ffmpeg
# Windows: Download from https://ffmpeg.org/download.html
```

## Environment Variables

Set in Vercel dashboard if using custom FFmpeg path:
- `FFMPEG_PATH` - Path to FFmpeg binary (defaults to "ffmpeg" if not set)

