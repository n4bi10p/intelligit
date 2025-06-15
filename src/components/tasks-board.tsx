"use client";

import React, { useState, useEffect } from 'react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Task, TaskStatus, Contributor, TaskAssignee } from '@/types';
import { UserCircle, GripVertical, PlusCircle, Edit3, Trash2, CalendarDays, Paperclip, CheckSquare, Square } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS as DndKitCSS } from '@dnd-kit/utilities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { nanoid } from 'nanoid';
import { useToast } from "@/hooks/use-toast"; // Corrected import path if needed

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
    transform: transform ? DndKitCSS.toString(transform) : undefined,
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

const columnNames: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const columnBorderColors: Record<TaskStatus, string> = {
  'To Do': 'border-red-500',
  'In Progress': 'border-yellow-500',
  'Done': 'border-green-500',
};

const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, onAddTask, onEditTask, onDeleteTask, onViewTask }) => {
  const { setNodeRef } = useDroppable({ id: status });
  const borderColor = columnBorderColors[status] || 'border-border';
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-0 bg-card rounded-lg shadow h-full border-2 ${borderColor} mx-2`}
      style={{ minWidth: 0 }}
    >
      <div className="flex justify-between items-center mb-3 px-4 pt-4">
        <h3 className="text-base font-semibold text-foreground">{status}</h3>
        {status === 'To Do' && onAddTask && (
          <Button variant="ghost" size="sm" onClick={() => onAddTask(status)} className="text-muted-foreground hover:text-foreground">
            <PlusCircle className="h-4 w-4 mr-1" />
            New
          </Button>
        )}
      </div>
      <ScrollArea className="flex-grow px-2 pb-4">
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

// Add contributors to props
interface TasksBoardProps {
  contributors: Contributor[];
  vscodeApi: { postMessage: (message: any) => void; };
  repositoryName?: string;
  repoOwner?: string; // Added to help construct repo full name
  repoName?: string;  // Added to help construct repo full name
  currentBranch?: string | null;
  assignerLogin?: string | null; // Changed from assignerName to assignerLogin
  currentUserName?: string | null; // To be used as assignerLogin
}

// Ensure all props are correctly destructured, especially assignerLogin
export function TasksBoard({ 
  contributors, 
  vscodeApi, 
  repositoryName, 
  repoOwner, 
  repoName, 
  currentBranch, 
  assignerLogin, // Changed from assignerName
  currentUserName // Ensuring this is available if it was intended for assigner logic
}: TasksBoardProps): JSX.Element {
  const { toast } = useToast(); 
  const columnNames: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Use propRepoOwner and propRepoName if provided, otherwise try to parse from repositoryName
  const repoOwnerDerived = repoOwner || repositoryName?.split('/')[0];
  const repoNameDerived = repoName || repositoryName?.split('/')[1];
  
  // State for adding tasks
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('To Do');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('');
  const [newTaskSubtasks, setNewTaskSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [newTaskAttachments, setNewTaskAttachments] = useState<{ name: string; url: string }[]>([]);

  // Effect for Loading Tasks
  useEffect(() => {
    if (repoOwnerDerived && repoNameDerived && vscodeApi) {
      console.log(`[TasksBoard] Requesting tasks for ${repoOwnerDerived}/${repoNameDerived}`);
      setInitialLoadComplete(false); 
      vscodeApi.postMessage({
        command: 'loadTasks',
        data: { repoOwner: repoOwnerDerived, repoName: repoNameDerived },
      });
    } else {
      setTasks([]);
      setInitialLoadComplete(false);
      // console.log('[TasksBoard] Missing repoOwner, repoName, or vscodeApi. Cannot load tasks.');
    }
  }, [repoOwnerDerived, repoNameDerived, vscodeApi]);

  // Effect for Listening to Messages (tasksLoaded and tasksSaved)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'tasksLoaded':
          if (message.error) {
            console.error('[TasksBoard] Error loading tasks:', message.error);
            toast({
              title: "Error Loading Tasks",
              description: message.error,
              variant: "destructive",
            });
            setTasks([]); 
          } else {
            // console.log('[TasksBoard] Tasks loaded from extension:', message.tasks);
            setTasks(message.tasks || []);
          }
          setInitialLoadComplete(true);
          break;
        case 'tasksSaved':
          if (message.success) {
            // console.log('[TasksBoard] Tasks saved successfully via extension.');
            // Optionally show a success toast, but it might be too frequent.
            // toast({ title: "Tasks Synced", description: "Your tasks have been saved.", variant: "success" });
          } else {
            console.error('[TasksBoard] Error saving tasks via extension:', message.error);
            toast({
              title: "Error Saving Tasks",
              description: message.error,
              variant: "destructive",
            });
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscodeApi, toast]);

  // Effect for Saving Tasks
  // This effect now triggers whenever `tasks` state changes *after* the initial load for the current repo is complete.
  useEffect(() => {
    // Only save if initial load for the current repo context is complete and we have repo context.
    if (initialLoadComplete && repoOwnerDerived && repoNameDerived && vscodeApi) {
      // console.log(`[TasksBoard] Debouncing save for ${repoOwnerDerived}/${repoNameDerived}`);
      const timer = setTimeout(() => {
        console.log(`[TasksBoard] Attempting to save tasks for ${repoOwnerDerived}/${repoNameDerived}:`, tasks);
        vscodeApi.postMessage({
          command: 'saveTasks',
          data: { repoOwner: repoOwnerDerived, repoName: repoNameDerived, tasks },
        });
      }, 1000); // Debounce save by 1 second
      return () => clearTimeout(timer);
    }
  }, [tasks, initialLoadComplete, repoOwnerDerived, repoNameDerived, vscodeApi]);

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
    const selectedContributor = contributors.find(c => c.login === newTaskAssigneeId);
    let assigneeForTask: TaskAssignee | undefined = undefined;
    if (selectedContributor) {
      assigneeForTask = {
        login: selectedContributor.login,
        name: selectedContributor.name || selectedContributor.login,
        avatarUrl: selectedContributor.avatar_url,
        email: selectedContributor.email || undefined
      };
    }

    const newTask: Task = {
      id: nanoid(), 
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      status: newTaskStatus,
      assignee: assigneeForTask,
      subtasks: newTaskSubtasks,
      dueDate: newTaskDueDate ? newTaskDueDate : undefined,
      attachments: newTaskAttachments.length > 0 ? newTaskAttachments : undefined,
      // Add repository context if available and needed by the Task type
      repository: (repoOwner && repoName) ? `${repoOwner}/${repoName}` : repositoryName || undefined,
      branch: currentBranch || undefined,
    };
    
    setTasks(prevTasks => {
        // Create a new list with the new task added
        const updatedTasks = [newTask, ...prevTasks];
        
        // This part is tricky. We want to ensure the new task is at the top of its column,
        // and the overall order of columns (To Do, In Progress, Done) is maintained,
        // and tasks within other columns maintain their relative order.

        const tasksByStatus: Record<TaskStatus, Task[]> = {
            'To Do': [],
            'In Progress': [],
            'Done': [],
        };

        // Add the new task to its designated status column first
        tasksByStatus[newTaskStatus].push(newTask);

        // Then add existing tasks, ensuring no duplicates and maintaining order within status
        prevTasks.forEach(task => {
            if (task.id !== newTask.id) { // Avoid duplicating the new task if it was somehow in prevTasks
                tasksByStatus[task.status].push(task);
            }
        });

        // Combine tasks from all columns in the desired order
        let finalOrderedTasks: Task[] = [];
        columnNames.forEach(status => {
            finalOrderedTasks = finalOrderedTasks.concat(tasksByStatus[status]);
        });

        return finalOrderedTasks;
    });

    if (assigneeForTask && vscodeApi) {
      const resolvedAssignerName = assignerLogin || 'System'; // Use assignerLogin prop
      vscodeApi.postMessage({
        command: 'sendTaskNotification',
        payload: {
          assigneeName: assigneeForTask.name || assigneeForTask.login,
          assigneeEmail: assigneeForTask.email,
          taskTitle: newTask.title,
          taskDescription: newTask.description || '',
          dueDate: newTask.dueDate || '',
          subtasks: newTask.subtasks || [],
          attachments: newTask.attachments || [],
          repositoryName: newTask.repository || '', // Use task's repo
          branchName: newTask.branch || '', // Use task's branch
          assignerName: resolvedAssignerName,
          message: `You have been assigned a new task: \\\"${newTask.title}\\\"`,
        }
      });
    }
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
    setEditedTaskAssigneeId(task.assignee?.login || '_unassigned_'); // Changed from ''
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
    const selectedContributor = contributors.find(c => c.login === editedTaskAssigneeId);
    let assigneeForTask: TaskAssignee | undefined = undefined;
    if (selectedContributor) {
      assigneeForTask = {
        login: selectedContributor.login,
        name: selectedContributor.name || selectedContributor.login,
        avatarUrl: selectedContributor.avatar_url,
        email: selectedContributor.email || undefined
      };
    }

    const updatedTaskData = { 
      title: editedTaskTitle.trim(), 
      description: editedTaskDescription.trim(), 
      assignee: assigneeForTask, 
      subtasks: editedTaskSubtasks, 
      dueDate: editedTaskDueDate ? editedTaskDueDate : undefined, 
      attachments: editedTaskAttachments.length > 0 ? editedTaskAttachments : undefined,
      // Preserve or update repo/branch context if editing allows it
      repository: editingTask.repository, // Assuming Task type has these
      branch: editingTask.branch,
    };

    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === editingTask.id 
          ? { ...task, ...updatedTaskData } 
          : task
      )
    );
    handleCloseEditTaskDialog();

    if (editingTask && assigneeForTask && editingTask.assignee?.login !== assigneeForTask.login) {
      const resolvedAssignerName = assignerLogin || 'System'; // Use assignerLogin prop
      vscodeApi.postMessage({
        command: 'sendTaskNotification',
        payload: {
          assigneeName: assigneeForTask.name || assigneeForTask.login, 
          assigneeEmail: assigneeForTask.email, 
          taskTitle: updatedTaskData.title,
          taskDescription: updatedTaskData.description || '',
          dueDate: updatedTaskData.dueDate || '',
          subtasks: updatedTaskData.subtasks || [],
          attachments: updatedTaskData.attachments || [],
          repositoryName: updatedTaskData.repository || '',
          branchName: updatedTaskData.branch || '',
          assignerName: resolvedAssignerName,
          message: `You have been assigned a new task: \\\"${updatedTaskData.title}\\\"`,
        }
      });
    }
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

    setTasks(prevTasks => {
      const activeTaskIndex = prevTasks.findIndex(t => t.id === activeId);
      if (activeTaskIndex === -1) return prevTasks;
      const activeTask = prevTasks[activeTaskIndex];

      // If dropped on a column, update status and move to top of that column
      if (["To Do", "In Progress", "Done"].includes(overId)) {
        if (activeTask.status !== overId) {
          // Remove from old position
          let filtered = prevTasks.filter(t => t.id !== activeId);
          // Insert at top of new column
          const insertIndex = filtered.findIndex(t => t.status === overId);
          const newTask = { ...activeTask, status: overId as TaskStatus };
          if (insertIndex === -1) {
            // No tasks in that column yet, append to end
            return [...filtered, newTask];
          } else {
            // Insert at the top of the new column
            return [
              ...filtered.slice(0, insertIndex),
              newTask,
              ...filtered.slice(insertIndex)
            ];
          }
        }
        return prevTasks;
      }

      // If dropped on another task, keep your previous logic
      let targetStatus: TaskStatus | undefined;
      const overIsATask = prevTasks.some(t => t.id === overId);
      if (overIsATask) {
        const overTaskIndex = prevTasks.findIndex(t => t.id === overId);
        if (overTaskIndex !== -1) {
          targetStatus = prevTasks[overTaskIndex].status;
        }
      }
      if (!targetStatus) return prevTasks;
      if (targetStatus === activeTask.status) {
        if (overIsATask && activeId !== overId) {
          const overTaskIndex = prevTasks.findIndex(t => t.id === overId);
          if (overTaskIndex !== -1) {
            return arrayMove(prevTasks, activeTaskIndex, overTaskIndex);
          }
        }
        return prevTasks;
      } else {
        let newTasks = prevTasks.map(task =>
          task.id === activeId ? { ...task, status: targetStatus! } : task
        );
        if (overIsATask) {
          const currentActiveTaskIndex = newTasks.findIndex(t => t.id === activeId);
          const targetOverTaskIndex = newTasks.findIndex(t => t.id === overId);
          if (currentActiveTaskIndex !== -1 && targetOverTaskIndex !== -1) {
            const [movedTask] = newTasks.splice(currentActiveTaskIndex, 1);
            const adjustedTargetIndex = currentActiveTaskIndex < targetOverTaskIndex ? targetOverTaskIndex - 1 : targetOverTaskIndex;
            newTasks.splice(adjustedTargetIndex, 0, movedTask);
          }
        }
        return newTasks;
      }
    });
  };

  const handleSendNotification = (task: Task, assignee: TaskAssignee) => {
    if (!assignee.email) {
      console.warn(`[TasksBoard] Assignee ${assignee.name} has no email. Cannot send notification.`);
      toast({
        title: "Cannot Send Notification",
        description: `Assignee ${assignee.name} has no email address configured.`,
        variant: "default", 
      });
      return;
    }

    const currentFullRepoName = (task.repository) ? task.repository : (repoOwner && repoName) ? `${repoOwner}/${repoName}` : '';
    const repoLink = currentFullRepoName ? `https://github.com/${currentFullRepoName}` : '#';
    
    const resolvedAssignerName = assignerLogin || 'System'; // Use assignerLogin prop

    const notificationPayload = {
      command: 'sendTaskNotification',
      taskDetails: {
        assigneeName: assignee.name,
        assigneeEmail: assignee.email,
        taskTitle: task.title,
        taskDescription: task.description || 'No description provided.',
        dueDate: task.dueDate || 'Not set',
        repositoryName: currentFullRepoName,
        repositoryLink: repoLink,
        assignerName: resolvedAssignerName, // Display name of the assigner
        assignerProfileLink: assignerProfile, 
      }
    };
    console.log('[TasksBoard] Sending task notification:', notificationPayload);
    vscodeApi.postMessage(notificationPayload);
    toast({
      title: "Task Assigned",
      description: `Notification sent to ${assignee.name} for task: ${task.title}.`,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext id="columns" items={columnNames} strategy={verticalListSortingStrategy}>
        <div className="p-4 flex flex-row gap-6 h-full min-h-[500px]" style={{ alignItems: 'stretch' }}>
          {columnNames.map((status, idx) => (
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
      </SortableContext>
      <DragOverlay>
        {/* For the overlay, edit/delete don't make sense, so pass empty functions or disable buttons if preferred */}
        {activeTask ? <DraggableTaskCard task={activeTask} isOverlay onEditTask={() => {}} onDeleteTask={() => {}} /> : null}
      </DragOverlay>

      {/* Add New Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task to {newTaskStatus}</DialogTitle>
            <DialogDescription>Fill in the details below to create a new task.</DialogDescription>
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
                Assignee
              </Label>
              <Select value={newTaskAssigneeId} onValueChange={setNewTaskAssigneeId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unassigned_">Unassigned</SelectItem>
                  {contributors.map(contributor => (
                    <SelectItem key={contributor.login} value={contributor.login}>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
                          <AvatarFallback>{(contributor.name || contributor.login).substring(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {contributor.name || contributor.login}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <DialogTitle>Edit Task: {editingTask?.title}</DialogTitle>
            <DialogDescription>Update the details for this task.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Edit Task Title Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-task-title"
                value={editedTaskTitle}
                onChange={(e) => setEditedTaskTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            {/* Edit Task Description Textarea */}
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
            {/* Edit Task Assignee Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-assignee" className="text-right">
                Assignee
              </Label>
              <Select value={editedTaskAssigneeId} onValueChange={setEditedTaskAssigneeId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unassigned_">Unassigned</SelectItem>
                  {contributors.map(contributor => (
                    <SelectItem key={contributor.login} value={contributor.login}>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
                          <AvatarFallback>{(contributor.name || contributor.login).substring(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {contributor.name || contributor.login}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Edit Task Subtasks */}
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
            <DialogDescription>
              Are you sure you want to delete the task "{deletingTask?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {/* <p className="py-4">Are you sure you want to delete the task "{deletingTask?.title}"?</p> */}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleCloseDeleteConfirmDialog}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDeleteTask}>Delete Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={isViewTaskDialogOpen} onOpenChange={setIsViewTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {viewingTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">{viewingTask.title}</DialogTitle>
                <DialogDescription>
                  Viewing details for task: {viewingTask.title}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <p className={`mt-1 text-sm px-2 py-0.5 rounded-full inline-block border ${statusColors[viewingTask.status]}`.replace('border-', 'bg-').replace('-500', '-100 text-') + statusColors[viewingTask.status].replace('border', 'text')}>
                    {viewingTask.status}
                  </p>
                </div>

                {viewingTask.assignee && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Assignee</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={viewingTask.assignee.avatarUrl} alt={viewingTask.assignee.name || viewingTask.assignee.login} />
                        <AvatarFallback>
                          {viewingTask.assignee.name ? viewingTask.assignee.name[0].toUpperCase() : viewingTask.assignee.login[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{viewingTask.assignee.name || viewingTask.assignee.login}</span>
                    </div>
                  </div>
                )}

                {viewingTask.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">{viewingTask.description}</p>
                  </div>
                )}

                {viewingTask.dueDate && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                    <div className="mt-1 flex items-center space-x-2 text-sm text-foreground">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(viewingTask.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {viewingTask.subtasks && viewingTask.subtasks.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Subtasks</Label>
                    <ul className="mt-1 space-y-2">
                      {viewingTask.subtasks.map(subtask => (
                        <li key={subtask.id} className="flex items-center space-x-2 text-sm text-foreground">
                          {subtask.completed ? <CheckSquare className="h-4 w-4 text-green-500" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                          <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>{subtask.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingTask.attachments && viewingTask.attachments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Attachments</Label>
                    <ul className="mt-1 space-y-2">
                      {viewingTask.attachments.map(attachment => (
                        <li key={attachment.name} className="flex items-center space-x-2 text-sm text-foreground">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {attachment.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={handleCloseViewTaskDialog}>Close</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
