import React from 'react';
import { priorityStyles } from '../styles/theme';

const TaskCard = ({ task, onClick }) => {
  const priority = priorityStyles[task.priority] || priorityStyles.medium;

  const formatDue = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const isOverdue = d < new Date() && task.status !== 'done';
    return {
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      overdue: isOverdue,
    };
  };

  const due = formatDue(task.dueDate);

  return (
    <div
      onClick={onClick}
      className="card card-hover"
      style={{
        padding: '13px 14px',
        marginBottom: '8px',
        cursor: 'pointer',
        borderLeft: `3px solid ${priority.border}`,
        transition: 'transform 0.18s var(--ease), box-shadow 0.18s var(--ease), border-color 0.18s var(--ease)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
        <span
          className="badge"
          style={{
            background: priority.bg,
            color: priority.text,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: priority.dot || priority.border,
            }}
          />
          {task.priority.toUpperCase()}
        </span>
      </div>

      <p
        style={{
          margin: '0 0 10px',
          fontWeight: 600,
          fontSize: '13.5px',
          color: 'var(--text)',
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {task.assignedTo ? (
          <span
            className="avatar"
            title={task.assignedTo.name}
            style={{
              width: '24px',
              height: '24px',
              fontSize: '10px',
              background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
            }}
          >
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </span>
        ) : (
          <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Unassigned</span>
        )}
        {due && (
          <span
            style={{
              fontSize: '10.5px',
              color: due.overdue ? 'var(--error-text)' : 'var(--text-muted)',
              fontWeight: due.overdue ? 700 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: due.overdue ? 'var(--error-bg)' : 'var(--inset)',
              padding: '2px 8px',
              borderRadius: 'var(--r-pill)',
            }}
          >
            {due.overdue && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            {due.label}
          </span>
        )}
      </div>

      {(task.comments?.length > 0 || task.attachments?.length > 0) && (
        <div
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-soft)',
            fontSize: '10.5px',
            color: 'var(--text-faint)',
            display: 'flex',
            gap: '12px',
          }}
        >
          {task.comments?.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {task.comments.length}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              {task.attachments.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
