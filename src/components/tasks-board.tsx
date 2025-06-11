"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockTasks, mockCollaborators } from '@/lib/mock-data';
import type { Task, TaskStatus } from '@/types';
import { UserCircle, GripVertical, PlusCircle, Edit3, Trash2 } from 'lucide-react'; // Removed SettingsIcon
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { nanoid } from 'nanoid';

// Helper function to reorder array items
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
}

const statusColors: Record<TaskStatus, string> = {
  'To Do': 'border-red-500',
  'In Progress': 'border-yellow-500',
  'Done': 'border-green-500',
};

interface DraggableTaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onEditTask: (task: Task) => void; 
  onDeleteTask: (task: Task) => void; 
  onViewTask?: (task: Task) => void;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, isOverlay = false, onEditTask, onDeleteTask, onViewTask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task: task, type: 'Task' }, 
  });

  const statusClass = statusColors[task.status] || 'border-transparent';

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.5 : 1,
    cursor: isOverlay ? 'grabbing' : 'grab',
    width: isOverlay ? '280px' : undefined, 
    boxShadow: isOverlay ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : undefined,
    zIndex: isOverlay ? 1000 : undefined,
  };

  // Prevent click from firing when clicking edit/delete/drag
  const handleCardClick = (e: React.MouseEvent) => {
    if (isOverlay) return;
    // Only fire if not clicking on a button
    if ((e.target as HTMLElement).closest('button')) return;
    if (onViewTask) onViewTask(task);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-3 bg-[hsl(var(--background))] border-border hover:shadow-lg transition-shadow relative border-l-4 ${statusClass} ${!isOverlay && onViewTask ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-foreground mb-1 flex-grow mr-2">{task.title}</p>
          {!isOverlay && (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                className="text-muted-foreground hover:text-foreground h-6 w-6 p-1"
                aria-label="Edit task"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                className="text-muted-foreground hover:text-destructive h-6 w-6 p-1"
                aria-label="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <button
                {...attributes}
                {...listeners}
                type="button"
                className="text-muted-foreground p-1 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Drag task"
                onClick={e => e.stopPropagation()} // Prevent card click
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {task.assignee && (
          <div className="flex items-center space-x-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} data-ai-hint={task.assignee.avatarHint || 'person avatar'}/>
              <AvatarFallback>
                <UserCircle className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask?: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void; 
  onDeleteTask: (task: Task) => void; 
  onViewTask?: (task: Task) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, onAddTask, onEditTask, onDeleteTask, onViewTask }) => {
  return (
    <div className="flex-1 min-w-[280px] bg-card p-3 rounded-lg shadow h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-base font-semibold text-foreground">{status}</h3>
        {status === 'To Do' && onAddTask && (
            <Button variant="ghost" size="sm" onClick={() => onAddTask(status)} className="text-muted-foreground hover:text-foreground">
              <PlusCircle className="h-4 w-4 mr-1" />
              New
            </Button>
        )}
      </div>
      <ScrollArea className="flex-grow pr-2">
        <SortableContext id={status} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[50px]">
            {tasks.map(task => (
              <DraggableTaskCard key={task.id} task={task} onEditTask={onEditTask} onDeleteTask={onDeleteTask} onViewTask={onViewTask} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};

export function TasksBoard(): JSX.Element {
  const columnNames: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // State for adding tasks
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('To Do');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('');
  const [newTaskSubtasks, setNewTaskSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [newTaskAttachments, setNewTaskAttachments] = useState<{ name: string; url: string }[]>([]);

  // State for editing tasks
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  const [editedTaskDescription, setEditedTaskDescription] = useState('');
  const [editedTaskAssigneeId, setEditedTaskAssigneeId] = useState<string>('');
  const [editedTaskSubtasks, setEditedTaskSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [editedTaskDueDate, setEditedTaskDueDate] = useState<string>('');
  const [editedTaskAttachments, setEditedTaskAttachments] = useState<{ name: string; url: string }[]>([]);

  // State for deleting tasks
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);

  // State for viewing tasks
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isViewTaskDialogOpen, setIsViewTaskDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskData = active.data.current?.task as Task | undefined;
    if (taskData) {
      setActiveTask(taskData);
    }
  };

  const handleOpenAddTaskDialog = (status: TaskStatus) => {
    setNewTaskStatus(status);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssigneeId('');
    setNewTaskSubtasks([]);
    setNewTaskDueDate('');
    setNewTaskAttachments([]);
    setIsAddTaskDialogOpen(true);
  };

  const handleAddNewTask = () => {
    if (!newTaskTitle.trim()) return;
    const assignee = mockCollaborators.find(c => c.id === newTaskAssigneeId);
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      status: newTaskStatus,
      assignee: assignee ? { name: assignee.name, avatarUrl: assignee.avatarUrl, avatarHint: assignee.avatarHint } : undefined,
      subtasks: newTaskSubtasks,
      dueDate: newTaskDueDate ? newTaskDueDate : undefined,
    };
    setTasks(prevTasks => [newTask, ...prevTasks.filter(t => t.status !== newTaskStatus), ...prevTasks.filter(t => t.status === newTaskStatus)]);
    // Place new task at the beginning of its column's list
    setTasks(prevTasks => {
        const newListOfTasks = [newTask, ...prevTasks];
        // Correctly reorder: new task at the top of its designated column, others preserved.
        const columnTasks = newListOfTasks.filter(t => t.status === newTaskStatus);
        const otherTasks = newListOfTasks.filter(t => t.status !== newTaskStatus);
        const reorderedColumnTasks = [newTask, ...columnTasks.filter(t => t.id !== newTask.id)];
        
        // Reconstruct tasks ensuring new task is first in its status group
        const finalTasks: Task[] = [];
        columnNames.forEach(colName => {
            if (colName === newTaskStatus) {
                finalTasks.push(...reorderedColumnTasks);
            } else {
                finalTasks.push(...otherTasks.filter(t => t.status === colName));
            }
        });
         // Filter out duplicates that might arise from previous logic
        const uniqueTasks = Array.from(new Set(finalTasks.map(t => t.id))).map(id => finalTasks.find(t => t.id === id)!);
        return uniqueTasks;
    });

    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssigneeId('');
    setNewTaskSubtasks([]);
    setNewTaskDueDate('');
    setNewTaskAttachments([]);
    setIsAddTaskDialogOpen(false);
  };

  const handleOpenEditTaskDialog = (task: Task) => {
    setEditingTask(task);
    setEditedTaskTitle(task.title);
    setEditedTaskDescription(task.description || '');
    setEditedTaskAssigneeId(
      mockCollaborators.find(c => c.name === task.assignee?.name)?.id || ''
    );
    setEditedTaskSubtasks(task.subtasks ? [...task.subtasks] : []);
    setEditedTaskDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
    setEditedTaskAttachments(task.attachments ? [...task.attachments] : []);
    setIsEditTaskDialogOpen(true);
  };

  const handleCloseEditTaskDialog = () => {
    setIsEditTaskDialogOpen(false);
    setEditingTask(null);
    setEditedTaskTitle('');
    setEditedTaskDescription('');
    setEditedTaskAssigneeId('');
    setEditedTaskSubtasks([]);
    setEditedTaskDueDate('');
    setEditedTaskAttachments([]);
  };

  const handleSaveEditedTask = () => {
    if (!editingTask || !editedTaskTitle.trim()) return;
    const assignee = mockCollaborators.find(c => c.id === editedTaskAssigneeId);
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === editingTask.id ? { ...task, title: editedTaskTitle.trim(), description: editedTaskDescription.trim(), assignee: assignee ? { name: assignee.name, avatarUrl: assignee.avatarUrl, avatarHint: assignee.avatarHint } : undefined, subtasks: editedTaskSubtasks, dueDate: editedTaskDueDate ? editedTaskDueDate : undefined, attachments: editedTaskAttachments } : task
      )
    );
    handleCloseEditTaskDialog();
  };

  const handleOpenDeleteConfirmDialog = (task: Task) => {
    setDeletingTask(task);
    setIsDeleteConfirmDialogOpen(true);
  };

  const handleCloseDeleteConfirmDialog = () => {
    setIsDeleteConfirmDialogOpen(false);
    setDeletingTask(null);
  };

  const handleConfirmDeleteTask = () => {
    if (!deletingTask) return;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== deletingTask.id));
    handleCloseDeleteConfirmDialog();
  };

  const handleOpenViewTaskDialog = (task: Task) => {
    setViewingTask(task);
    setIsViewTaskDialogOpen(true);
  };

  const handleCloseViewTaskDialog = () => {
    setIsViewTaskDialogOpen(false);
    setViewingTask(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !active) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId && !columnNames.includes(overId as TaskStatus)) return; // Dropped on itself (and not on a column)

    setTasks(prevTasks => {
      const activeTaskIndex = prevTasks.findIndex(t => t.id === activeId);
      if (activeTaskIndex === -1) return prevTasks;

      const activeTask = prevTasks[activeTaskIndex];

      // Determine target column status
      let targetStatus: TaskStatus | undefined;
      const overIsAColumn = columnNames.includes(overId as TaskStatus);
      const overIsATask = prevTasks.some(t => t.id === overId);
      const overContainerId = over.data.current?.sortable?.containerId as TaskStatus | undefined;

      if (overIsAColumn) {
        targetStatus = overId as TaskStatus;
      } else if (overIsATask) {
        const overTaskIndex = prevTasks.findIndex(t => t.id === overId);
        if (overTaskIndex !== -1) {
          targetStatus = prevTasks[overTaskIndex].status;
        }
      } else if (overContainerId && columnNames.includes(overContainerId)) {
        targetStatus = overContainerId;
      }

      if (!targetStatus) return prevTasks; // Could not determine target status

      // Case 1: Reordering within the same column
      if (targetStatus === activeTask.status) {
        if (overIsATask && activeId !== overId) { // Ensure dropping on a different task within the same column
          const overTaskIndex = prevTasks.findIndex(t => t.id === overId);
          if (overTaskIndex !== -1) {
            return arrayMove(prevTasks, activeTaskIndex, overTaskIndex);
          }
        }
        // If dropped on the column itself (not a specific task) or on itself, no reorder action.
        return prevTasks;
      }
      // Case 2: Moving to a different column
      else {
        let newTasks = prevTasks.map(task =>
          task.id === activeId ? { ...task, status: targetStatus! } : task
        );
        // If dropped onto a specific task in the new column, try to place it there
        if (overIsATask) {
            const currentActiveTaskIndex = newTasks.findIndex(t => t.id === activeId);
            const targetOverTaskIndex = newTasks.findIndex(t => t.id === overId);
            if (currentActiveTaskIndex !== -1 && targetOverTaskIndex !== -1) {
                 // Temporarily remove, then insert. This ensures it's part of the array for arrayMove.
                const [movedTask] = newTasks.splice(currentActiveTaskIndex, 1);
                // Adjust target index if current was before target
                const adjustedTargetIndex = currentActiveTaskIndex < targetOverTaskIndex ? targetOverTaskIndex -1 : targetOverTaskIndex;
                newTasks.splice(adjustedTargetIndex, 0, movedTask);
            }
        }
        return newTasks;
      }
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* The header containing the SettingsIcon button has been removed. */}
      {/* Main content area for columns directly under DndContext or a simplified wrapper */}
      <div className="p-4 flex space-x-4 flex-grow overflow-x-auto h-full">
        {columnNames.map(status => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks.filter(task => task.status === status)}
            onAddTask={status === 'To Do' ? handleOpenAddTaskDialog : undefined}
            onEditTask={handleOpenEditTaskDialog}
            onDeleteTask={handleOpenDeleteConfirmDialog}
            onViewTask={handleOpenViewTaskDialog} 
          />
        ))}
      </div>

      <DragOverlay>
        {/* For the overlay, edit/delete don't make sense, so pass empty functions or disable buttons if preferred */}
        {activeTask ? <DraggableTaskCard task={activeTask} isOverlay onEditTask={() => {}} onDeleteTask={() => {}} /> : null}
      </DragOverlay>

      {/* Add New Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task to {newTaskStatus}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-task-title" className="text-right">
                Title
              </Label>
              <Input
                id="add-task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter task title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-task-description" className="text-right">
                Description
              </Label>
              <textarea
                id="add-task-description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="col-span-3 min-h-[40px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter task description"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Subtasks</Label>
              <div className="col-span-3 space-y-2">
                {newTaskSubtasks.map((subtask, idx) => (
                  <div key={subtask.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={e => {
                        setNewTaskSubtasks(subs => subs.map((s, i) => i === idx ? { ...s, completed: e.target.checked } : s));
                      }}
                    />
                    <Input
                      value={subtask.title}
                      onChange={e => setNewTaskSubtasks(subs => subs.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
                      placeholder={`Subtask ${idx + 1}`}
                      className="flex-1"
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => setNewTaskSubtasks(subs => subs.filter((_, i) => i !== idx))}>
                      ×
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setNewTaskSubtasks(subs => [...subs, { id: nanoid(), title: '', completed: false }])}>
                  + Add Subtask
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-task-assignee" className="text-right">
                Contributor
              </Label>
              <div className="col-span-3">
                <Select value={newTaskAssigneeId} onValueChange={setNewTaskAssigneeId}>
                  <SelectTrigger id="add-task-assignee" className="w-full">
                    <SelectValue placeholder="Select Contributor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCollaborators.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-task-due-date" className="text-right">Due Date</Label>
              <Input
                id="add-task-due-date"
                type="date"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Attachments</Label>
              <div className="col-span-3 space-y-2">
                <label className="block">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="add-task-attachments-input"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setNewTaskAttachments(prev => [
                        ...prev,
                        ...files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }))
                      ]);
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('add-task-attachments-input')?.click()}>
                    {newTaskAttachments.length > 0 ? 'Add More Files' : 'Choose Files'}
                  </Button>
                </label>
                {newTaskAttachments.length > 0 && (
                  <ul className="list-disc pl-4">
                    {newTaskAttachments.map((att, idx) => (
                      <li key={att.url} className="flex items-center gap-2">
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{att.name}</a>
                        <Button type="button" size="icon" variant="ghost" onClick={() => setNewTaskAttachments(attachments => attachments.filter((_, i) => i !== idx))}>×</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleAddNewTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-task-title"
                value={editedTaskTitle}
                onChange={(e) => setEditedTaskTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter task title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-description" className="text-right">
                Description
              </Label>
              <textarea
                id="edit-task-description"
                value={editedTaskDescription}
                onChange={(e) => setEditedTaskDescription(e.target.value)}
                className="col-span-3 min-h-[40px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter task description"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Subtasks</Label>
              <div className="col-span-3 space-y-2">
                {editedTaskSubtasks.map((subtask, idx) => (
                  <div key={subtask.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={e => {
                        setEditedTaskSubtasks(subs => subs.map((s, i) => i === idx ? { ...s, completed: e.target.checked } : s));
                      }}
                    />
                    <Input
                      value={subtask.title}
                      onChange={e => setEditedTaskSubtasks(subs => subs.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
                      placeholder={`Subtask ${idx + 1}`}
                      className="flex-1"
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditedTaskSubtasks(subs => subs.filter((_, i) => i !== idx))}>
                      ×
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setEditedTaskSubtasks(subs => [...subs, { id: nanoid(), title: '', completed: false }])}>
                  + Add Subtask
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-assignee" className="text-right">
                Contributor
              </Label>
              <div className="col-span-3">
                <Select value={editedTaskAssigneeId} onValueChange={setEditedTaskAssigneeId}>
                  <SelectTrigger id="edit-task-assignee" className="w-full">
                    <SelectValue placeholder="Select Contributor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCollaborators.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-due-date" className="text-right">Due Date</Label>
              <Input
                id="edit-task-due-date"
                type="date"
                value={editedTaskDueDate}
                onChange={e => setEditedTaskDueDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Attachments</Label>
              <div className="col-span-3 space-y-2">
                <label className="block">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="edit-task-attachments-input"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setEditedTaskAttachments(prev => [
                        ...prev,
                        ...files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }))
                      ]);
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('edit-task-attachments-input')?.click()}>
                    {editedTaskAttachments.length > 0 ? 'Add More Files' : 'Choose Files'}
                  </Button>
                </label>
                {editedTaskAttachments.length > 0 && (
                  <ul className="list-disc pl-4">
                    {editedTaskAttachments.map((att, idx) => (
                      <li key={att.url} className="flex items-center gap-2">
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{att.name}</a>
                        <Button type="button" size="icon" variant="ghost" onClick={() => setEditedTaskAttachments(attachments => attachments.filter((_, i) => i !== idx))}>×</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseEditTaskDialog}>Cancel</Button>
            <Button type="submit" onClick={handleSaveEditedTask}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="py-4">Are you sure you want to delete the task "{deletingTask?.title}"?</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDeleteConfirmDialog}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDeleteTask}>Delete Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={isViewTaskDialogOpen} onOpenChange={setIsViewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {viewingTask && (
            <div className="grid gap-4 py-2">
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <div className="text-base font-semibold text-foreground mt-1">{viewingTask.title}</div>
              </div>
              {viewingTask.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <div className="text-sm text-foreground mt-1 whitespace-pre-line">{viewingTask.description}</div>
                </div>
              )}
              {viewingTask.subtasks && viewingTask.subtasks.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Subtasks</Label>
                  <div className="flex flex-col gap-1 mt-1">
                    {viewingTask.subtasks.map((subtask, idx) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={subtask.completed} readOnly />
                        <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>{subtask.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewingTask.dueDate && (
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <div className="text-sm text-foreground mt-1">{new Date(viewingTask.dueDate).toLocaleDateString()}</div>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="text-sm text-foreground mt-1">{viewingTask.status}</div>
              </div>
              {viewingTask.assignee && (
                <div>
                  <Label className="text-xs text-muted-foreground">Contributor</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={viewingTask.assignee.avatarUrl} alt={viewingTask.assignee.name} />
                      <AvatarFallback>{viewingTask.assignee.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{viewingTask.assignee.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseViewTaskDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
