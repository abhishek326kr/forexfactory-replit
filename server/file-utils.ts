import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

// File type configurations
export const FILE_TYPES = {
  EA: {
    extensions: ['.ex4', '.ex5', '.mq4', '.mq5'],
    maxSize: 50 * 1024 * 1024, // 50MB
    mimeTypes: [
      'application/octet-stream',
      'application/x-metatrader',
      'application/x-mql4',
      'application/x-mql5'
    ]
  },
  IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
  },
  DOCUMENT: {
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
    maxSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  }
};

// Generate unique filename to prevent conflicts
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  
  // Sanitize filename
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  
  return `${sanitizedName}_${timestamp}_${randomString}${ext}`;
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Validate file type
export function validateFileType(filename: string, category: 'EA' | 'IMAGE' | 'DOCUMENT'): boolean {
  const ext = path.extname(filename).toLowerCase();
  return FILE_TYPES[category].extensions.includes(ext);
}

// Validate file size
export function validateFileSize(size: number, category: 'EA' | 'IMAGE' | 'DOCUMENT'): boolean {
  return size <= FILE_TYPES[category].maxSize;
}

// Get MIME type for EA files
export function getEAMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.ex4': 'application/x-metatrader4',
    '.ex5': 'application/x-metatrader5',
    '.mq4': 'application/x-mql4',
    '.mq5': 'application/x-mql5'
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// Clean up old/unused files
export default async function cleanupOldFiles(directory: string, daysOld: number = 30): Promise<number> {
  const now = Date.now();
  const maxAge = daysOld * 24 * 60 * 60 * 1000;
  let deletedCount = 0;
  
  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
  
  return deletedCount;
}

export { cleanupOldFiles };

// Scan for malicious patterns in filenames and content
export function scanForMaliciousPatterns(filename: string, content?: Buffer): {
  safe: boolean;
  reason?: string;
} {
  // Check filename for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Directory traversal
    /[<>:"|?*]/g, // Invalid characters
    /\.(exe|bat|cmd|sh|ps1|vbs|js)$/i, // Potentially dangerous extensions
    /%00/g, // Null byte injection
    /\x00/g, // Null characters
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(filename)) {
      return { safe: false, reason: 'Suspicious filename pattern detected' };
    }
  }
  
  // If content is provided, check for malicious patterns
  if (content) {
    const contentStr = content.toString('utf8', 0, Math.min(1000, content.length));
    
    // Check for common script injection patterns
    const maliciousContentPatterns = [
      /<script[^>]*>/gi,
      /<iframe[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers
      /eval\s*\(/gi,
      /document\.(write|cookie|location)/gi,
    ];
    
    for (const pattern of maliciousContentPatterns) {
      if (pattern.test(contentStr)) {
        return { safe: false, reason: 'Potentially malicious content detected' };
      }
    }
  }
  
  return { safe: true };
}

// Create directory if it doesn't exist
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}

// Get file metadata
export async function getFileMetadata(filePath: string): Promise<{
  size: number;
  created: Date;
  modified: Date;
  extension: string;
  name: string;
} | null> {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: path.extname(filePath),
      name: path.basename(filePath)
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
}

// Delete file safely
export async function deleteFileSafely(filePath: string): Promise<boolean> {
  try {
    // Ensure the file path is within uploads directory
    const uploadsDir = path.resolve('./server/uploads');
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(uploadsDir)) {
      console.error('Attempt to delete file outside uploads directory');
      return false;
    }
    
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}