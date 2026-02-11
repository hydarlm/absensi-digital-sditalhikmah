import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users, Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface UserData {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
  assigned_classes?: string[];
}

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({ username: '', password: '', role: 'teacher' });
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
    loadClasses();
  }, [isAdmin, navigate]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat data pengguna', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const handleAddUser = async () => {
    // Comprehensive Validation matching backend schema
    const errors: string[] = [];

    if (!formData.username.trim()) {
      errors.push('Username wajib diisi');
    } else if (formData.username.trim().length < 3) {
      errors.push('Username minimal 3 karakter');
    } else if (formData.username.trim().length > 50) {
      errors.push('Username maksimal 50 karakter');
    }

    if (!formData.password.trim()) {
      errors.push('Password wajib diisi');
    } else if (formData.password.length < 6) {
      errors.push('Password minimal 6 karakter');
    }

    if (!['admin', 'teacher'].includes(formData.role)) {
      errors.push('Role harus admin atau guru');
    }

    if (errors.length > 0) {
      toast({
        title: 'Error Validasi',
        description: errors.join('. '),
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({ title: 'Sukses', description: 'Pengguna berhasil dibuat' });
        setShowAddModal(false);
        setFormData({ username: '', password: '', role: 'teacher' });
        setShowPassword(false); // Reset visibility
        loadUsers();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.detail, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal membuat pengguna', variant: 'destructive' });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      // Build update payload - only include fields that have values
      const updateData: any = {};

      if (formData.username && formData.username.trim()) {
        updateData.username = formData.username.trim();
      }

      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }

      if (formData.role) {
        updateData.role = formData.role;
      }

      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({ title: 'Sukses', description: 'Pengguna berhasil diperbarui' });
        setShowEditModal(false);
        setFormData({ username: '', password: '', role: 'teacher' });
        setShowEditPassword(false);
        loadUsers();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.detail, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memperbarui pengguna', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });

      if (response.ok) {
        toast({ title: 'Sukses', description: 'Pengguna berhasil dihapus' });
        setShowDeleteModal(false);
        loadUsers();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.detail, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menghapus pengguna', variant: 'destructive' });
    }
  };

  const handleAssignClasses = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ class_names: selectedClasses }),
      });

      if (response.ok) {
        toast({ title: 'Sukses', description: 'Kelas berhasil disimpan' });
        setShowAssignModal(false);
        loadUsers();
      } else {
        toast({ title: 'Error', description: 'Gagal menyimpan kelas', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: ' Error', description: 'Gagal menyimpan kelas', variant: 'destructive' });
    }
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setFormData({ username: user.username, password: '', role: user.role });
    setShowEditPassword(false); // Reset visibility
    setShowEditModal(true);
  };

  const openAssignModal = (user: UserData) => {
    setSelectedUser(user);
    setSelectedClasses(user.assigned_classes || []);
    setShowAssignModal(true);
  };

  if (loading) return <div className="p-4 sm:p-6">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Kelola Pengguna</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manajemen pengguna dan assignment kelas untuk guru</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Daftar Pengguna</CardTitle>
          <CardDescription className="text-sm">Semua pengguna dalam sistem</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Kelas yang Ditugaskan</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span>
                    </TableCell>
                    <TableCell>
                      {user.role === 'teacher' ? (
                        user.assigned_classes && user.assigned_classes.length > 0 ? (
                          <span className="text-sm">{user.assigned_classes.join(', ')}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Belum ada kelas</span>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">Semua kelas</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.role === 'teacher' && (
                          <Button size="sm" variant="outline" onClick={() => openAssignModal(user)}>
                            <Users className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Card List */}
          <div className="lg:hidden space-y-4 px-4">
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{user.username}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Kelas: </span>
                    {user.role === 'teacher' ? (
                      user.assigned_classes && user.assigned_classes.length > 0 ? (
                        <span className="font-medium">{user.assigned_classes.join(', ')}</span>
                      ) : (
                        <span className="text-muted-foreground">Belum ada kelas</span>
                      )
                    ) : (
                      <span className="font-medium">Semua kelas</span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dibuat: </span>
                    <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(user)} className="flex-1 min-w-[80px]">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {user.role === 'teacher' && (
                    <Button size="sm" variant="outline" onClick={() => openAssignModal(user)} className="flex-1 min-w-[80px]">
                      <Users className="h-4 w-4 mr-1" />
                      Kelas
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 min-w-[80px]">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) {
            // Reset form when modal closes
            setFormData({ username: '', password: '', role: 'teacher' });
            setShowPassword(false);
          }
        }}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Tambah Pengguna Baru</DialogTitle>
            <DialogDescription className="text-sm">Buat akun pengguna baru untuk sistem</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm sm:text-base">
                Username
              </Label>
              <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} autoComplete="off" className="mt-1.5 text-base" />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm sm:text-base">
                Password (minimal 6 karakter)
              </Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="pr-10 text-base" autoComplete="new-password" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="role" className="text-sm sm:text-base">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={handleAddUser} className="w-full sm:w-auto">
              Buat Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Pengguna</DialogTitle>
            <DialogDescription className="text-sm">Perbarui informasi pengguna</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username" className="text-sm sm:text-base">
                Username
              </Label>
              <Input id="edit-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} autoComplete="off" className="mt-1.5 text-base" />
            </div>
            <div>
              <Label htmlFor="edit-password" className="text-sm sm:text-base">
                Password (kosongkan jika tidak diubah)
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="edit-password"
                  type={showEditPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password baru"
                  className="pr-10 text-base"
                  autoComplete="new-password"
                />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowEditPassword(!showEditPassword)}>
                  {showEditPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-role" className="text-sm sm:text-base">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={handleEditUser} className="w-full sm:w-auto">
              Perbarui Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Classes Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Atur Kelas untuk {selectedUser?.username}</DialogTitle>
            <DialogDescription className="text-sm">
              Pilih kelas mana saja yang bisa diakses oleh guru ini untuk absensi.
              <br />
              Guru hanya bisa melihat Dashboard dan Scan Absensi untuk kelas yang dipilih.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2">
            {classes.map((className) => (
              <div key={className} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                <Checkbox
                  id={className}
                  checked={selectedClasses.includes(className)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedClasses([...selectedClasses, className]);
                    } else {
                      setSelectedClasses(selectedClasses.filter((c) => c !== className));
                    }
                  }}
                />
                <label htmlFor={className} className="text-sm cursor-pointer flex-1">
                  {className}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAssignModal(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={handleAssignClasses} className="w-full sm:w-auto">
              Simpan Kelas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Hapus Pengguna</DialogTitle>
            <DialogDescription className="text-sm">Yakin ingin menghapus {selectedUser?.username}? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} className="w-full sm:w-auto">
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
