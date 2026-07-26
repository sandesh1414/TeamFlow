import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskDetailModal from './TaskDetailModal';
import { columnStyles } from '../styles/theme';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

const KanbanBoard = ({ tasks, setTasks, teamId, members }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const { user } = useAuth();

  const getColumnTasks = (status) => tasks.filter((t) => t.status === status);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;

    setTasks((prev) => prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t)));

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/tasks/${draggableId}`, { status: newStatus }, config);
    } catch (err) {
      console.error('Failed to update task status', err);
      setTasks((prev) => prev.map((t) => (t._id === draggableId ? { ...t, status: source.droppableId } : t)));
    }
  };

  const handleTaskCreated = (newTask) => setTasks((prev) => [newTask, ...prev]);
  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  };
  const handleTaskDeleted = (taskId) => setTasks((prev) => prev.filter((t) => t._id !== taskId));

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Add Task</button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {COLUMNS.map((col) => {
            const colStyle = columnStyles[col.id];
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} style={{ background: colStyle.bg, borderRadius: 'var(--r-lg)', padding: '16px', minHeight: '420px', border: '1px solid var(--border-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colStyle.dot }} />
                    <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.005em' }}>{col.label}</h3>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--surface)', padding: '2px 9px', borderRadius: 'var(--r-pill)' }}>
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '260px', borderRadius: 'var(--r-md)',
                        background: snapshot.isDraggingOver ? 'rgba(37,99,235,0.06)' : 'transparent',
                        transition: 'background 0.2s', padding: '2px',
                      }}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.92 : 1,
                              }}
                            >
                              <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '12px', padding: '28px 12px', borderRadius: 'var(--r-md)', border: '1px dashed var(--border)' }}>
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showCreateModal && (
        <TaskModal teamId={teamId} members={members} onClose={() => setShowCreateModal(false)} onTaskCreated={handleTaskCreated} />
      )}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onTaskUpdated={handleTaskUpdated} onTaskDeleted={handleTaskDeleted} />
      )}
    </div>
  );
};

export default KanbanBoard;
