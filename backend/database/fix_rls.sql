-- 1. Drop the existing recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- 2. Create a SECURITY DEFINER function to fetch the role without triggering RLS
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

-- 3. Recreate the policies using the safe function
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING ( get_user_role(auth.uid()) = 'admin' );

CREATE POLICY "Admins can create profiles" ON profiles
  FOR INSERT WITH CHECK ( get_user_role(auth.uid()) = 'admin' );

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING ( get_user_role(auth.uid()) = 'admin' );
