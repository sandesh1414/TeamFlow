import { priorityStyles } from '../styles/theme';

const TaskCard = ({ task, onClick }) => {
  const priority = priorityStyles[task.priority] || priorityStyles.medium;

  const formatDue = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const isOverdue = d < new Date() && task.status !== 'done';
    return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), overdue: isOverdue };
  };

  const due = formatDue(task.dueDate);

  return (
    <div
      onClick={onClick}
      className="card card-hover"
      style={{ padding: '14px', marginBottom: '10px', cursor: 'pointer', borderLeft: `4px solid ${priority.border}` }}
    >
      <span className="badge" style={{ background: priority.bg, color: priority.text }}>
        {task.priority.toUpperCase()}
      </span>
      <p style={{ margin: '9px 0 10px', fontWeight: 600, fontSize: '14px', color: 'var(--text)', lineHeight: 1.4 }}>{task.title}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {task.assignedTo ? (
          <span className="avatar" title={task.assignedTo.name} style={{ width: '26px', height: '26px', fontSize: '11px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)' }}>
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Unassigned</span>
        )}
        {due && (
          <span style={{ fontSize: '11px', color: due.overdue ? 'var(--error-text)' : 'var(--text-muted)', fontWeight: due.overdue ? 700 : 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
            {due.overdue && <span>⚠</span>}{due.label}
          </span>
        )}
      </div>
      {(task.comments?.length > 0 || task.attachments?.length > 0) && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-soft)', fontSize: '11px', color: 'var(--text-faint)', display: 'flex', gap: '12px' }}>
          {task.comments?.length > 0 && <span>💬 {task.comments.length}</span>}
          {task.attachments?.length > 0 && <span>📎 {task.attachments.length}</span>}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
