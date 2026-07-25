import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskDetailModal from './TaskDetailModal';

const COLUMNS = [
  { id: 'todo',       label: '📋 To Do',      color: '#e3f2fd' },
  { id: 'inprogress', label: '⚡ In Progress', color: '#fff8e1' },
  { id: 'done',       label: '✅ Done',        color: '#e8f5e9' },
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

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t)));

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/tasks/${draggableId}`, { status: newStatus }, config);
    } catch (err) {
      console.error('Failed to update task status', err);
      // Revert on failure
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
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowCreateModal(true)} style={{ padding: '10px 20px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          + Add Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {COLUMNS.map((col) => (
            <div key={col.id} style={{ background: col.color, borderRadius: '14px', padding: '16px', minHeight: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{col.label}</h3>
                <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  {getColumnTasks(col.id).length}
                </span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ minHeight: '200px', background: snapshot.isDraggingOver ? 'rgba(108,99,255,0.08)' : 'transparent', borderRadius: '8px', transition: 'background 0.2s', padding: '2px' }}
                  >
                    {getColumnTasks(col.id).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.85 : 1,
                              transform: snapshot.isDragging
                                ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                : provided.draggableProps.style?.transform,
                            }}
                          >
                            <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
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
