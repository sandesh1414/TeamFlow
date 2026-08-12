// Dynamic design tokens for values that vary at runtime (priority colors, status chips, etc.)

export const priorityStyles = {
  low: { bg: '#ecfdf5', text: '#047857', border: '#10b981' },
  medium: { bg: '#fffbeb', text: '#b45309', border: '#f59e0b' },
  high: { bg: '#fef2f2', text: '#b91c1c', border: '#ef4444' },
  urgent: { bg: '#fff1f2', text: '#be123c', border: '#f43f5e' },
};

export const columnStyles = {
  todo: { bg: '#f1f5f9', label: 'To Do', dot: '#94a3b8' },
  inprogress: { bg: '#fffbeb', label: 'In Progress', dot: '#f59e0b' },
  done: { bg: '#ecfdf5', label: 'Done', dot: '#10b981' },
};

export const statusLabel = (status) =>
  status === 'todo' ? 'To Do' : status === 'inprogress' ? 'In Progress' : 'Done';

export const avatarGradient = (seed) => {
  const gradients = [
    'linear-gradient(135deg, #2563eb, #3b82f6)',
    'linear-gradient(135deg, #0d9488, #14b8a6)',
    'linear-gradient(135deg, #db2777, #f472b6)',
    'linear-gradient(135deg, #ea580c, #fb923c)',
    'linear-gradient(135deg, #7c3aed, #a78bfa)',
    'linear-gradient(135deg, #0891b2, #22d3ee)',
  ];
  const idx = seed ? String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length : 0;
  return gradients[idx];
};
