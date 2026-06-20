# Admin User Manager Redesign

## Goal

Make the owner-only Manage Admin Users page easier to scan, add users from the page, separate owner/admin accounts from scoped users, and group scoped users by their real access category.

## Current access model

- The owner account is the only full administrator.
- Database-managed accounts are restricted to their own blog content.
- Passwords are stored as hashes and are never displayed after creation.

## Page design

1. **Add User** accordion
   - Username, display name, password, and access category.
   - The current category is **Blogs** because that is the only scoped permission implemented by the site.
2. **Existing Admin Users** accordion
   - Shows the owner account separately as a compact protected card.
3. **Existing Users** accordion
   - Contains nested category accordions.
   - **Blogs** contains all database-managed accounts, including `jessie_v` when that account exists.
4. **Compact cards**
   - Username, display name, and category stay visible.
   - Password reset and login-delivery controls move into a compact expandable section.
   - Destructive actions remain clearly separated.

## Data and security

- Continue using the existing `admin_users` table and server-only service credentials.
- Do not commit or display the supplied plaintext password.
- Do not broaden permissions: database-managed users remain blog-only.
- The page stays owner-only.

## Verification

- Unit-test account grouping and category labels.
- Run the production Next.js build.
- Verify the final diff excludes unrelated work.
