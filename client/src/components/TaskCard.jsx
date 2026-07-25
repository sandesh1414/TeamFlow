const PRIORITY_COLORS = {
  low:    { bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' },
  medium: { bg: '#fff8e1', text: '#f57f17', border: '#ffb300' },
  high:   { bg: '#fce4ec', text: '#c62828', border: '#e53935' },
  urgent: { bg: '#f3e5f5', text: '#6a1b9a', border: '#8e24aa' },
};

const TaskCard = ({ task, onClick }) => {
  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  const formatDue = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const isOverdue = d < new Date() && task.status !== 'done';
    return { label: d.toLocaleDateString(), overdue: isOverdue };
  };

  const due = formatDue(task.dueDate);

  return (
    <div
      onClick={onClick}
      style={{ background: 'white', borderRadius: '10px', padding: '14px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: `4px solid ${priority.border}`, transition: 'box-shadow 0.2s' }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
    >
      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: priority.bg, color: priority.text }}>
        {task.priority.toUpperCase()}
      </span>
      <p style={{ margin: '8px 0 8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>{task.title}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {task.assignedTo ? (
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#6c63ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }} title={task.assignedTo.name}>
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </div>
        ) : (
          <span style={{ fontSize: '11px', color: '#bbb' }}>Unassigned</span>
        )}
        {due && (
          <span style={{ fontSize: '11px', color: due.overdue ? '#e53935' : '#999', fontWeight: due.overdue ? '600' : '400' }}>
            {due.overdue ? '⚠ ' : ''}{due.label}
          </span>
        )}
      </div>
      {task.comments?.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#bbb' }}>
          💬 {task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}
          {task.attachments?.length > 0 && ` · 📎 ${task.attachments.length}`}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
