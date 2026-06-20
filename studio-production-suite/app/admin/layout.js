import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminBreadcrumbs />
      {children}
    </>
  );
}
