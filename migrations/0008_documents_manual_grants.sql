-- Super Admin assigns document CRUD. Website roles do not receive it automatically.

DELETE FROM role_permissions
WHERE permission_id LIKE 'documents.%'
  AND role_id != 'super_admin';
