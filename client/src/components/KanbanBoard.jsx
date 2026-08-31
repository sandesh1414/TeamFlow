import React from 'react';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskDetailModal from './TaskDetailModal';
import { columnStyles } from '../styles/theme';

const COLUMN_ICONS = {
  todo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/></svg>,
  inprogress: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  done: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

const KanbanBoard = ({ tasks, setTasks, teamId, members, myRole }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const { user } = useAuth();

  const getColumnTasks = (status) => tasks.filter((t) => t.status === status);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId;

    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.put(`/api/tasks/${draggableId}`, { status: newStatus }, config);
    } catch (err) {
      console.error('Failed to update task status', err);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === draggableId ? { ...t, status: source.droppableId } : t
        )
      );
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t._id === newTask._id);
      if (exists) return prev;
      return [newTask, ...prev];
    });
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
  };

  const handleTaskDeleted = (taskId) =>
    setTasks((prev) => prev.filter((t) => t._id !== taskId));

  return (
    <div>
      {myRole === 'owner' && (
        <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Drag cards across columns to update status
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Task
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '18px',
          }}
        >
          {COLUMNS.map((col) => {
            const colStyle = columnStyles[col.id];
            const colTasks = getColumnTasks(col.id);
            return (
              <div
                key={col.id}
                className="kanban-col"
                style={{ background: colStyle.bg }}
              >
                <div className="kanban-col-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: colStyle.accent || 'var(--text)' }}>
                    {COLUMN_ICONS[col.id]}
                    <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.005em' }}>
                      {col.label}
                    </h3>
                  </div>
                  <span className="kanban-col-count">
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '260px',
                        borderRadius: 'var(--r-md)',
                        background: snapshot.isDraggingOver
                          ? 'rgba(37,99,235,0.05)'
                          : 'transparent',
                        transition: 'background 0.2s',
                        padding: '2px',
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
                                opacity: snapshot.isDragging ? 0.9 : 1,
                              }}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => setSelectedTask(task)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="kanban-empty">
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
        <TaskModal
          teamId={teamId}
          members={members}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          myRole={myRole}
        />
      )}
    </div>
  );
};

export default KanbanBoard;


