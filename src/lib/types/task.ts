export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'delayed' | 'abandoned';

export type Task = {
  id: number;
  accountId: number | null;
  businessId: number | null;
  content: string;
  status: TaskStatus;
  assignedTo: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  accountName?: string | null;
  businessName?: string | null;
};

export type CreateTaskInput = {
  accountId?: number;
  businessId?: number;
  content: string;
  status?: TaskStatus;
  assignedTo?: string;
  createdBy: string;
};

export type UpdateTaskInput = {
  content?: string;
  status?: TaskStatus;
  assignedTo?: string;
  accountId?: number | null;
  businessId?: number | null;
  updatedBy: string;
};

export type TasksResponse = {
  success: boolean;
  tasks: Task[];
  total?: number;
};

export type TaskResponse = {
  success: boolean;
  task: Task;
};

export type TaskErrorResponse = {
  success: false;
  error: string;
  message: string;
};
