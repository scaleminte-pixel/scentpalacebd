export interface UploadProgressInfo {
  percent: number;
  stage: 'idle' | 'uploading' | 'converting' | 'done' | 'error';
  originalSizeFormatted?: string;
  optimizedSizeFormatted?: string;
  savedPercent?: number;
  fileName?: string;
  url?: string;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  fileName: string;
  alt: string;
  originalSize: number;
  optimizedSize: number;
  originalSizeFormatted: string;
  optimizedSizeFormatted: string;
  savedPercent: number;
  dimensions: { width: number; height: number };
  format: string;
  message: string;
  error?: string;
}

export function uploadImageWithProgress(
  file: File,
  onProgress: (info: UploadProgressInfo) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    onProgress({
      percent: 0,
      stage: 'uploading',
      fileName: file.name,
    });

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
        if (percent >= 99) {
          onProgress({
            percent: 100,
            stage: 'converting',
            fileName: file.name,
          });
        } else {
          onProgress({
            percent,
            stage: 'uploading',
            fileName: file.name,
          });
        }
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const res: UploadResult = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.success) {
          onProgress({
            percent: 100,
            stage: 'done',
            url: res.url,
            fileName: res.fileName,
            originalSizeFormatted: res.originalSizeFormatted,
            optimizedSizeFormatted: res.optimizedSizeFormatted,
            savedPercent: res.savedPercent,
          });
          resolve(res);
        } else {
          const err = res.error || 'Failed to upload and convert image';
          onProgress({
            percent: 0,
            stage: 'error',
            error: err,
          });
          reject(new Error(err));
        }
      } catch (err: any) {
        onProgress({
          percent: 0,
          stage: 'error',
          error: 'Invalid response from upload server',
        });
        reject(err);
      }
    });

    xhr.addEventListener('error', () => {
      const err = 'Network error during upload';
      onProgress({
        percent: 0,
        stage: 'error',
        error: err,
      });
      reject(new Error(err));
    });

    xhr.addEventListener('abort', () => {
      const err = 'Upload aborted';
      onProgress({
        percent: 0,
        stage: 'error',
        error: err,
      });
      reject(new Error(err));
    });

    xhr.open('POST', '/api/admin/upload');
    xhr.send(formData);
  });
}

