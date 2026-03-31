-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'main_manager', 'branch_manager')),
  branch_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create a SECURITY DEFINER function to fetch the role without triggering RLS
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING ( get_user_role(auth.uid()) = 'admin' );

-- Allow admins to insert profiles
CREATE POLICY "Admins can create profiles" ON profiles
  FOR INSERT WITH CHECK ( get_user_role(auth.uid()) = 'admin' );

-- Allow admins to update profiles
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING ( get_user_role(auth.uid()) = 'admin' );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user'); -- Default role, will be updated by admin
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_branch_id_idx ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS profiles_created_by_idx ON profiles(created_by);

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view branches" ON branches FOR SELECT USING (true);
CREATE POLICY "Admins can insert branches" ON branches FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update branches" ON branches FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can delete branches" ON branches FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON products FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update products" ON products FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can delete products" ON products FOR DELETE USING (get_user_role(auth.uid()) = 'admin');