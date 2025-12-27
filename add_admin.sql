-- Helper script to add a user as an admin
-- Replace 'USER_EMAIL_HERE' with the email of the user you want to make an admin
-- Or replace 'USER_ID_HERE' with the UUID of the user from auth.users table

-- Method 1: Add admin by email
INSERT INTO admin_users (user_id)
SELECT id 
FROM auth.users 
WHERE email = 'k.mlodkowski@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Method 2: Add admin by user ID (UUID)
-- INSERT INTO admin_users (user_id)
-- VALUES ('USER_ID_HERE')
-- ON CONFLICT (user_id) DO NOTHING;

-- To remove an admin:
-- DELETE FROM admin_users WHERE user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE');

-- To list all admins:
-- SELECT au.user_id, u.email, au.created_at
-- FROM admin_users au
-- JOIN auth.users u ON au.user_id = u.id;

