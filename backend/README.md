# Dairy System Backend

A Node.js/Express backend for a dairy management system with user authentication and role-based access control.

## Features

- **User Management**: Admin can create and manage users with different roles
- **Authentication**: JWT-based authentication with role-based permissions
- **Database**: Supabase integration for authentication and data storage
- **Roles**: Admin, Main Manager, Branch Manager

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Update the `.env` file with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Database Setup

Run the SQL schema in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/schema.sql`
4. Run the query

### 4. Create Initial Admin User

You'll need to create the first admin user manually in Supabase:

1. Go to **Authentication > Users** in your Supabase dashboard
2. Click **Add user**
3. Enter admin email and password
4. After creation, go to **Table Editor > profiles**
5. Update the profile record to set `role = 'admin'`

## Running the Server

```bash
npm run dev
```

The server will start on port 3004 (or the port specified in PORT environment variable).

## API Endpoints

### Authentication

#### Admin Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### User Management (Admin Only)

All user management endpoints require `Authorization: Bearer <jwt_token>` header.

#### Create User
```http
POST /api/users
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "main_manager", // or "branch_manager" or "admin"
  "branch_id": "branch_001" // optional for branch_manager, null for others
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "main_manager",
    "branch_id": "branch_001",
    "defaultPassword": "TempPass123!"
  },
  "note": "Please inform the user to change their password after first login"
}
```

#### Get All Users
```http
GET /api/users
Authorization: Bearer <admin_jwt_token>
```

### Health Check

```http
GET /health
```

## User Roles

- **admin**: Can create/manage all user types, full system access
- **main_manager**: Main branch management role
- **branch_manager**: Branch-specific management role

## Security Notes

- Default password for new users: `TempPass123!`
- JWT tokens expire in 24 hours
- Only admins can create other admin accounts
- All user creation requires admin authentication
- Change the JWT_SECRET in production to a long, random string

## Testing

Use the `test.rest` file with VS Code REST Client extension to test the API endpoints.

## Database Schema

The `profiles` table stores user role information:
- `id`: UUID (references auth.users)
- `role`: User role (admin, main_manager, branch_manager)
- `branch_id`: Branch identifier (for branch managers)
- `created_by`: Admin who created the user
- `created_at`: Timestamp