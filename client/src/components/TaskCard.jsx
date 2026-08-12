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
        padding: '14px',
        marginBottom: '10px',
        cursor: 'pointer',
        borderLeft: `3px solid ${priority.border}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: priority.dot || priority.border,
            }}
          />
          {task.priority.toUpperCase()}
        </span>
      </div>

      <p
        style={{
          margin: '0 0 12px',
          fontWeight: 600,
          fontSize: '14px',
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
              width: '26px',
              height: '26px',
              fontSize: '11px',
              background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
            }}
          >
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Unassigned</span>
        )}
        {due && (
          <span
            style={{
              fontSize: '11px',
              color: due.overdue ? 'var(--error-text)' : 'var(--text-muted)',
              fontWeight: due.overdue ? 700 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: due.overdue ? 'var(--error-bg)' : 'var(--inset)',
              padding: '3px 8px',
              borderRadius: 'var(--r-pill)',
            }}
          >
            {due.overdue && <span>⚠</span>}
            {due.label}
          </span>
        )}
      </div>

      {(task.comments?.length > 0 || task.attachments?.length > 0) && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-soft)',
            fontSize: '11px',
            color: 'var(--text-faint)',
            display: 'flex',
            gap: '14px',
          }}
        >
          {task.comments?.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {task.comments.length}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              {task.attachments.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
