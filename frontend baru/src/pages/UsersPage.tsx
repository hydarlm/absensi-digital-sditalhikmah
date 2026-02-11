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
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
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
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
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
                variant: 'destructive'
            });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(formData)
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
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(updateData)
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
            const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
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
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ class_names: selectedClasses })
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

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Kelola Pengguna</h1>
                    <p className="text-muted-foreground">Manajemen pengguna dan assignment kelas untuk guru</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pengguna
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengguna</CardTitle>
                    <CardDescription>Semua pengguna dalam sistem</CardDescription>
                </CardHeader>
                <CardContent>
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
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {user.role}
                                        </span>
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
                                            <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


            {/* Add User Modal */}
            <Dialog open={showAddModal} onOpenChange={(open) => {
                setShowAddModal(open);
                if (!open) {
                    // Reset form when modal closes
                    setFormData({ username: '', password: '', role: 'teacher' });
                    setShowPassword(false);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                        <DialogDescription>Buat akun pengguna baru untuk sistem</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password (minimal 6 karakter)</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="pr-10"
                                    autoComplete="new-password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="role">Role</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
                        <Button onClick={handleAddUser}>Buat Pengguna</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Pengguna</DialogTitle>
                        <DialogDescription>Perbarui informasi pengguna</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-username">Username</Label>
                            <Input
                                id="edit-username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-password">Password (kosongkan jika tidak diubah)</Label>
                            <div className="relative">
                                <Input
                                    id="edit-password"
                                    type={showEditPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Password baru"
                                    className="pr-10"
                                    autoComplete="new-password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                >
                                    {showEditPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
                        <Button onClick={handleEditUser}>Perbarui Pengguna</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Classes Modal */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Atur Kelas untuk {selectedUser?.username}</DialogTitle>
                        <DialogDescription>
                            Pilih kelas mana saja yang bisa diakses oleh guru ini untuk absensi.<br />
                            Guru hanya bisa melihat Dashboard dan Scan Absensi untuk kelas yang dipilih.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {classes.map((className) => (
                            <div key={className} className="flex items-center space-x-2">
                                <Checkbox
                                    id={className}
                                    checked={selectedClasses.includes(className)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedClasses([...selectedClasses, className]);
                                        } else {
                                            setSelectedClasses(selectedClasses.filter(c => c !== className));
                                        }
                                    }}
                                />
                                <label htmlFor={className} className="text-sm cursor-pointer">{className}</label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignModal(false)}>Batal</Button>
                        <Button onClick={handleAssignClasses}>Simpan Kelas</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Pengguna</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus {selectedUser?.username}? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
