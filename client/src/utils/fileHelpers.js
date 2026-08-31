export const getFileIcon = (mimetype, filename) => {
  if (!mimetype && !filename) return '📄';
  if (mimetype?.startsWith('image/')) return '🖼️';
  if (mimetype === 'application/pdf') return '📕';
  if (mimetype?.includes('word') || filename?.endsWith('.doc') || filename?.endsWith('.docx')) return '📝';
  if (mimetype?.startsWith('video/')) return '🎬';
  if (mimetype?.startsWith('text/')) return '📃';
  return '📄';
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const isImage = (mimetype) => mimetype?.startsWith('image/');

