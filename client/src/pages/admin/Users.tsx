
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Users, MoreHorizontal, Check, X } from 'lucide-react';
import { toastSuccess, toastError, confirmDialog } from '@/utils/i18nToast';
import { toast } from 'sonner';
import axios from 'axios';
import api from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
interface User {
  _id?: string;
  id?: number | string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  dateOfBirth?: string;
  role?: string;
  status?: string;
}

const AdminUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  // normalize selected IDs to strings to avoid type mismatches (mongo _id vs numeric id)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Ensure user is authenticated; actual Authorization header handling is done by the shared api instance
  const ensureAuthenticated = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]);
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle user selection
  const toggleUserSelection = (userId: string|number) => {
    const sid = String(userId);
    setSelectedUsers(prev => 
      prev.includes(sid) 
        ? prev.filter(id => id !== sid) 
        : [...prev, sid]
    );
  };
  
  // Select all users
  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      // store ids as strings
      const ids = filteredUsers.map(user => String(user._id || user.id)).filter(Boolean) as string[];
      setSelectedUsers(ids);
    }
  };
  
  // Change user status
  const changeUserStatus = (userId: string|number, newStatus: string) => {
    // Persist to server and update local state
    (async () => {
      try {
        ensureAuthenticated();
        await api.put(`/admin/users/${userId}`, { status: newStatus.toLowerCase() });
        setUsers(prev => prev.map(user => (String(user._id || user.id) === String(userId) ? { ...user, status: newStatus } : user)));
        toastSuccess(`تم تغيير حالة المستخدم إلى ${newStatus}`, `User status changed to ${newStatus}`);
      } catch (err) {
        console.error('Error changing status', err);
        toastError('فشل تغيير حالة المستخدم', 'Could not change user status');
      }
    })();
  };
  
  // Change user role
  const changeUserRole = (userId: string|number, newRole: string) => {
    (async () => {
      try {
        ensureAuthenticated();
        await api.put(`/admin/users/${userId}`, { role: newRole.toLowerCase() });
        setUsers(prev => prev.map(user => (String(user._id || user.id) === String(userId) ? { ...user, role: newRole } : user)));
        toastSuccess(`تم تغيير دور المستخدم إلى ${newRole}`, `User role changed to ${newRole}`);
      } catch (err) {
        console.error('Error changing role', err);
        toastError('فشل تغيير دور المستخدم', 'Could not change user role');
      }
    })();
  };
  
  // Bulk action: activate users
  const bulkActivateUsers = () => {
    (async () => {
      try {
        ensureAuthenticated();
        await Promise.all(selectedUsers.map(id => api.put(`/admin/users/${id}`, { status: 'active' })));
        setUsers(prev => prev.map(user => (
          selectedUsers.some(sel => String(sel) === String(user._id || user.id)) ? { ...user, status: 'Active' } : user
        )));
        toastSuccess(`تم تفعيل ${selectedUsers.length} مستخدم`, `${selectedUsers.length} users activated`);
        setSelectedUsers([]);
      } catch (err) {
        console.error('Bulk activate error', err);
        toastError('فشل تفعيل المستخدمين المحددين', 'Could not activate selected users');
      }
    })();
  };
  
  // Bulk action: deactivate users
  const bulkDeactivateUsers = () => {
    (async () => {
      try {
        ensureAuthenticated();
        await Promise.all(selectedUsers.map(id => api.put(`/admin/users/${id}`, { status: 'inactive' })));
        setUsers(prev => prev.map(user => (
          selectedUsers.some(sel => String(sel) === String(user._id || user.id)) ? { ...user, status: 'Inactive' } : user
        )));
        toastSuccess(`تم تعطيل ${selectedUsers.length} مستخدم`, `${selectedUsers.length} users deactivated`);
        setSelectedUsers([]);
      } catch (err) {
        console.error('Bulk deactivate error', err);
        toastError('فشل تعطيل المستخدمين المحددين', 'Could not deactivate selected users');
      }
    })();
  };

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      ensureAuthenticated();
      const response = await api.get('/admin/users');
      // response.data.data is expected (see admin controller)
      setUsers(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          // Not authenticated
          navigate('/login');
          return;
        }
        if (status === 403) {
          // Forbidden - user is not admin or lacks permissions
          toast.error('You are not authorized to view this page (Admin only)');
          // Optionally navigate away to a safer page
          navigate('/');
          return;
        }
      }
      toast.error('Could not load users');
      setLoading(false);
    }
  }, [ensureAuthenticated, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Modal state for viewing/editing a single user
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user', status: 'active' });

  // Accept either a DOB string or a User object and detect common DOB fields
  const computeAge = (dobOrUser?: string | User | null) => {
    if (!dobOrUser) return null;
    let dobStr: string | undefined;
    if (typeof dobOrUser === 'string') dobStr = dobOrUser;
    else {
      const u = dobOrUser as User;
      const extra = u as unknown as Record<string, unknown>;
      dobStr = String(u.dateOfBirth || extra['dob'] || extra['birthdate'] || extra['birthDate'] || '');
      if (!dobStr) dobStr = undefined;
    }
    if (!dobStr) return null;
    const birth = new Date(dobStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const viewUserDetails = async (userId: string) => {
    try {
      ensureAuthenticated();
      const res = await api.get(`/admin/users/${userId}`);
      const u = res.data.data;
      setModalUser(u);
      setEditForm({
        name: u.name || '',
        email: u.email || '',
  role: u.role || 'user',
  status: u.status || 'active'
      });
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching user details', err);
      toast.error('Could not load user details');
    }
  };

  const saveUserEdits = async () => {
    if (!modalUser) return;
    try {
      ensureAuthenticated();

      // Do not allow changing email from this modal; only send name/role/status
      const payload: Partial<User> = { name: editForm.name, role: editForm.role, status: editForm.status };
      const res = await api.put(`/admin/users/${modalUser._id || modalUser.id}`, payload);
      const updated = res.data.data || res.data;
      setUsers(prev => prev.map(u => (String(u._id || u.id) === String(updated._id || updated.id) ? updated : u)));
      toast.success('User updated');
      setShowModal(false);
      setModalUser(null);
    } catch (err) {
      console.error('Error saving user edits', err);
      // Provide clearer messages for common server errors
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data;
        if (serverMsg && /duplicate|unique/i.test(String(serverMsg))) {
          toast.error('That email is already in use by another account');
          return;
        }
        if (serverMsg) {
          toast.error(String(serverMsg));
          return;
        }
      }
      toast.error('Could not save changes');
    }
  };

  // Delete a user (admin)
  const deleteUser = async (userId: string) => {
    if (!confirmDialog('هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء', 'Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      ensureAuthenticated();
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => String(u._id || u.id) !== String(userId)));
      // Remove from selection if present
      setSelectedUsers(prev => prev.filter(id => id !== String(userId)));
      toastSuccess('تم حذف المستخدم', 'User deleted');
    } catch (err) {
      console.error('Error deleting user', err);
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.response?.data;
        if (msg) {
          toast.error(String(msg));
          return;
        }
      }
      toastError('فشل حذف المستخدم', 'Could not delete user');
    }
  };
  
  return (
    
  <div className="p-6">
        <div className="flex justify-center mb-6">
          <h1 className="text-2xl font-bold">{t('admin.users.title', { defaultValue: 'Users Management' })}</h1>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('admin.users.searchPlaceholder', { defaultValue: 'Search users...' })}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {t('admin.users.selected', { count: selectedUsers.length, defaultValue: `${selectedUsers.length} users selected` })}
                  </span>
                  <Button size="sm" variant="outline" onClick={bulkActivateUsers}>
                    <Check className="mr-2 h-4 w-4" />
                    {t('admin.users.activate', { defaultValue: 'Activate' })}
                  </Button>
                  <Button size="sm" variant="outline" onClick={bulkDeactivateUsers}>
                    <X className="mr-2 h-4 w-4" />
                    {t('admin.users.deactivate', { defaultValue: 'Deactivate' })}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">{t('admin.users.listTitle', { defaultValue: 'Users List' })}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tourtastic-blue"></div>
              </div>
            )}
            {!loading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={
                        filteredUsers.length > 0 && selectedUsers.length > 0 &&
                        selectedUsers.length === filteredUsers.map(u => String(u._id || u.id)).filter(Boolean).length
                      }
                      onChange={selectAllUsers}
                    />
                  </TableHead>
                  <TableHead>{t('admin.users.table.user', { defaultValue: 'User' })}</TableHead>
                  <TableHead>{t('admin.users.table.role', { defaultValue: 'Role' })}</TableHead>
                  <TableHead>{t('admin.users.table.status', { defaultValue: 'Status' })}</TableHead>
                  <TableHead className="text-right">{t('admin.users.table.actions', { defaultValue: 'Actions' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const id = String(user._id || user.id);
                  const defaultRole = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'User';
                  const roleLabel = t(`roles.${user.role}`, { defaultValue: defaultRole });
                  const defaultStatus = user.status ? (user.status.charAt(0).toUpperCase() + user.status.slice(1)) : 'Inactive';
                  const statusLabel = t(`status.${user.status}`, { defaultValue: defaultStatus });
                  return (
                    <TableRow key={id} className={statusLabel === 'Inactive' ? 'opacity-70' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedUsers.includes(id)}
                          onChange={() => toggleUserSelection(id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {/* No avatar images - show initials only */}
                            <AvatarFallback>{(user.name || '').substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          roleLabel === 'Admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : roleLabel === 'Editor' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {roleLabel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusLabel === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {statusLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewUserDetails(id)}>
                              {t('admin.users.viewDetails', { defaultValue: 'View Details' })}
                            </DropdownMenuItem>
                            {statusLabel === 'Active' ? (
                              <DropdownMenuItem onClick={() => changeUserStatus(id, 'Inactive')}>
                                {t('admin.users.deactivate', { defaultValue: 'Deactivate' })}
                              </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => changeUserStatus(id, 'Active')}>
                                  {t('admin.users.activate', { defaultValue: 'Activate' })}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                                onClick={() => changeUserRole(id, roleLabel === t('roles.admin', { defaultValue: 'Admin' }) ? 'User' : 'Admin')}
                            >
                                {t('admin.users.changeRole', { defaultValue: 'Change Role' })}
                            </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteUser(id)} className="text-red-600">
                                {t('admin.users.delete', { defaultValue: 'Delete' })}
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
    {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <Users className="h-10 w-10 text-gray-400 mb-2" />
      <p className="text-gray-500">{t('admin.users.noUsers', { defaultValue: 'No users found' })}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}

            {/* Simple modal for viewing/editing a user */}
            {showModal && modalUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">{t('admin.users.editUser', { defaultValue: 'Edit User' })}</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600">{t('admin.users.name', { defaultValue: 'Name' })}</label>
                      <input className="mt-1 w-full border rounded px-2 py-1" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">{t('admin.users.username', { defaultValue: 'Username' })}</label>
                      <p className="mt-1 w-full text-gray-700">{modalUser?.username || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">{t('admin.users.email', { defaultValue: 'Email' })}</label>
                      <p className="mt-1 w-full text-gray-700">{modalUser?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">{t('admin.users.phone', { defaultValue: 'Phone' })}</label>
                      <p className="mt-1 w-full text-gray-700">{modalUser?.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">{t('admin.users.age', { defaultValue: 'Age' })}</label>
                      <p className="mt-1 w-full text-gray-700">{computeAge(modalUser) ?? '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600">{t('admin.users.role', { defaultValue: 'Role' })}</label>
                        <select className="mt-1 w-full border rounded px-2 py-1" value={editForm.role} onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">{t('admin.users.status', { defaultValue: 'Status' })}</label>
                        <select className="mt-1 w-full border rounded px-2 py-1" value={editForm.status} onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}>
                          <option value="active">{t('status.active', { defaultValue: 'Active' })}</option>
                          <option value="inactive">{t('status.inactive', { defaultValue: 'Inactive' })}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => { setShowModal(false); setModalUser(null); }}>
                      {t('cancel', { defaultValue: 'Cancel' })}
                    </Button>
                    <Button onClick={saveUserEdits}>
                      {t('save', { defaultValue: 'Save' })}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default AdminUsers;

/* Modal markup (kept outside main component return for brevity) */
