export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'main_manager' | 'branch_manager';
  branch_id?: string;
  branch_name?: string;
  status: 'active' | 'inactive';
  last_login?: string;
  created_at: string;
}

export interface UserFormData {
  id?: string;
  full_name: string;
  email: string;
  role: 'admin' | 'main_manager' | 'branch_manager';
  branch_id?: string;
  status: 'active' | 'inactive';
  password?: string;
}
