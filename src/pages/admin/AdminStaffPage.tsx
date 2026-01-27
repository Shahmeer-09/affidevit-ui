import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/features';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useGetCommissionersQuery,
  useCreateCommissionerMutation,
  useUpdateCommissionerMutation,
  useDeleteCommissionerMutation,
  useGetReviewersQuery,
  useCreateReviewerMutation,
  useUpdateReviewerMutation,
  useDeleteReviewerMutation,
  type Commissioner,
  type Reviewer,
} from '@/store/api/adminApi';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Users,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type StaffType = 'commissioner' | 'reviewer';

interface StaffFormData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  commission_number?: string;
  commission_expiry?: string;
  payout_rate?: string;
  is_featured?: boolean;
  bio?: string;
  organization?: string;
  profile_image?: File | null;
}

const initialFormData: StaffFormData = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  commission_number: '',
  commission_expiry: '',
  payout_rate: '0.00',
  is_featured: false,
  bio: '',
  organization: '',
  profile_image: null,
};

export function AdminStaffPage() {
  const [activeTab, setActiveTab] = useState<StaffType>('commissioner');
  const [searchQuery, setSearchQuery] = useState('');
  const [commissionerPage, setCommissionerPage] = useState(1);
  const [reviewerPage, setReviewerPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingStaff, setEditingStaff] = useState<Commissioner | Reviewer | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);

  // Commissioner API hooks
  const { data: commissionersData, isLoading: loadingCommissioners, isError: commissionersError, refetch: refetchCommissioners } = useGetCommissionersQuery({
    page: commissionerPage,
    search: searchQuery,
  });
  const [createCommissioner, { isLoading: creatingCommissioner }] = useCreateCommissionerMutation();
  const [updateCommissioner, { isLoading: updatingCommissioner }] = useUpdateCommissionerMutation();
  const [deleteCommissioner, { isLoading: deletingCommissioner }] = useDeleteCommissionerMutation();

  // Reviewer API hooks
  const { data: reviewersData, isLoading: loadingReviewers, isError: reviewersError, refetch: refetchReviewers } = useGetReviewersQuery({
    page: reviewerPage,
    search: searchQuery,
  });
  const [createReviewer, { isLoading: creatingReviewer }] = useCreateReviewerMutation();
  const [updateReviewer, { isLoading: updatingReviewer }] = useUpdateReviewerMutation();
  const [deleteReviewer, { isLoading: deletingReviewer }] = useDeleteReviewerMutation();

  // Extract data from API response (paginated)
  const commissioners: Commissioner[] = commissionersData?.results || [];
  const reviewers: Reviewer[] = reviewersData?.results || [];
  const filteredCommissioners = commissioners;
  const filteredReviewers = reviewers;
  const paginatedReviewers = reviewers;

  // Pagination
  const ITEMS_PER_PAGE = 10;
  // const currentPage = activeTab === 'commissioner' ? commissionerPage : reviewerPage;
  const startIndex = (commissionerPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + filteredCommissioners.length;

  const isError = activeTab === 'commissioner' ? commissionersError : reviewersError;
  const isCreating = activeTab === 'commissioner' ? creatingCommissioner : creatingReviewer;
  const isUpdating = activeTab === 'commissioner' ? updatingCommissioner : updatingReviewer;
  const isDeleting = activeTab === 'commissioner' ? deletingCommissioner : deletingReviewer;

  const totalCommissionerPages = Math.ceil((commissionersData?.count || 0) / ITEMS_PER_PAGE);
  const totalReviewerPages = Math.ceil((reviewersData?.count || 0) / ITEMS_PER_PAGE);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setEditingStaff(null);
    setShowPassword(false);
    setShowCreateDialog(true);
  };

  const handleOpenEdit = (staff: Commissioner | Reviewer) => {
    setEditingStaff(staff);
    setFormData({
      username: staff.username,
      email: staff.email,
      password: '', // Don't show password for edit
      first_name: staff.first_name,
      last_name: staff.last_name,
      commission_number: 'commission_number' in staff ? staff.commission_number || '' : '',
      commission_expiry: 'commission_expiry' in staff ? staff.commission_expiry || '' : '',
      payout_rate: 'payout_rate' in staff ? staff.payout_rate || '0.00' : '0.00',
      is_featured: 'is_featured' in staff ? staff.is_featured : false,
      bio: 'bio' in staff ? staff.bio || '' : '',
      organization: 'organization' in staff ? staff.organization || '' : '',
      profile_image: null,
    });
    setShowPassword(false);
    setShowEditDialog(true);
  };

  const handleCreate = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('role', activeTab);

      if (activeTab === 'commissioner') {
        if (formData.commission_number) formDataToSend.append('commission_number', formData.commission_number);
        if (formData.commission_expiry) formDataToSend.append('commission_expiry', formData.commission_expiry);
        if (formData.payout_rate) formDataToSend.append('payout_rate', formData.payout_rate);
        formDataToSend.append('is_featured', String(formData.is_featured || false));
        if (formData.bio) formDataToSend.append('bio', formData.bio);
        if (formData.organization) formDataToSend.append('organization', formData.organization);
        if (formData.profile_image) formDataToSend.append('profile_image', formData.profile_image);
        await createCommissioner(formDataToSend).unwrap();
      } else {
        await createReviewer(formDataToSend).unwrap();
      }

      toast.success(`${activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'} created successfully`);
      setShowCreateDialog(false);
      setFormData(initialFormData);
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string; [key: string]: unknown } };
      const message = err.data?.detail || Object.values(err.data || {}).flat().join(', ') || 'Failed to create staff member';
      toast.error(message);
    }
  };

  const handleUpdate = async () => {
    if (!editingStaff) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      if (formData.password) formDataToSend.append('password', formData.password);

      if (activeTab === 'commissioner') {
        if (formData.commission_number) formDataToSend.append('commission_number', formData.commission_number);
        if (formData.commission_expiry) formDataToSend.append('commission_expiry', formData.commission_expiry);
        if (formData.payout_rate) formDataToSend.append('payout_rate', formData.payout_rate);
        formDataToSend.append('is_featured', String(formData.is_featured || false));
        if (formData.bio) formDataToSend.append('bio', formData.bio);
        if (formData.organization) formDataToSend.append('organization', formData.organization);
        if (formData.profile_image) formDataToSend.append('profile_image', formData.profile_image);
        await updateCommissioner({ id: editingStaff.id, data: formDataToSend }).unwrap();
      } else {
        await updateReviewer({ id: editingStaff.id, data: formDataToSend }).unwrap();
      }

      toast.success(`${activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'} updated successfully`);
      setShowEditDialog(false);
      setEditingStaff(null);
      setFormData(initialFormData);
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string; [key: string]: unknown } };
      const message = err.data?.detail || 'Failed to update staff member';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      if (activeTab === 'commissioner') {
        await deleteCommissioner(deleteId).unwrap();
      } else {
        await deleteReviewer(deleteId).unwrap();
      }

      toast.success(`${activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'} deleted successfully`);
      setDeleteId(null);
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      toast.error(err.data?.detail || 'Failed to delete staff member');
    }
  };

  const refetch = () => {
    if (activeTab === 'commissioner') {
      refetchCommissioners();
    } else {
      refetchReviewers();
    }
  };

  // Stats
  const stats = {
    commissioners: commissionersData?.count || 0,
    reviewers: reviewersData?.count || 0,
    featuredCommissioners: '-', // Stats require dedicated endpoint
    activeReviewers: '-',
  };

  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load staff members</h3>
            <p className="text-muted-foreground mb-4">Please try again later</p>
            <Button onClick={refetch}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Staff Management"
        description="Create and manage commissioners and reviewers"
      >
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'}
        </Button>
      </DashboardHeader>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.commissioners}</p>
                <p className="text-sm text-muted-foreground">Commissioners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <UserCheck className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.featuredCommissioners}</p>
                <p className="text-sm text-muted-foreground">Featured Commissioners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.reviewers}</p>
                <p className="text-sm text-muted-foreground">Reviewers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <UserCheck className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeReviewers}</p>
                <p className="text-sm text-muted-foreground">Active Reviewers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StaffType)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="commissioner" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Commissioners
          </TabsTrigger>
          <TabsTrigger value="reviewer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Reviewers
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="relative mt-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Commissioners Tab */}
        <TabsContent value="commissioner" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Commissioners</CardTitle>
              <CardDescription>
                Commissioners can finalize affidavits and mark them as complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCommissioners ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : commissioners.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No commissioners found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try a different search term' : 'Add your first commissioner'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleOpenCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Commissioner
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Commission #</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissioners.map((commissioner: Commissioner) => (
                      <TableRow key={commissioner.id}>
                        <TableCell>
                          {commissioner.profile_image_url ? (
                            <img 
                              src={commissioner.profile_image_url} 
                              alt={commissioner.full_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Shield className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{commissioner.full_name}</p>
                            <p className="text-xs text-muted-foreground">{commissioner.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{commissioner.organization || '-'}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {commissioner.commission_number || '-'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {commissioner.commission_expiry
                            ? format(new Date(commissioner.commission_expiry), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {commissioner.is_featured ? (
                            <Badge variant="default">Featured</Badge>
                          ) : (
                            <Badge variant="secondary">Standard</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(commissioner)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(commissioner.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredCommissioners.length > ITEMS_PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredCommissioners.length)} of {filteredCommissioners.length}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCommissionerPage(Math.max(1, commissionerPage - 1))}
                          className={commissionerPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalCommissionerPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCommissionerPage(page)}
                            isActive={commissionerPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCommissionerPage(Math.min(totalCommissionerPages, commissionerPage + 1))}
                          className={commissionerPage === totalCommissionerPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviewers Tab */}
        <TabsContent value="reviewer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reviewers</CardTitle>
              <CardDescription>
                Reviewers check AI-generated affidavits before approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReviewers ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredReviewers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviewers found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try a different search term' : 'Add your first reviewer'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleOpenCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reviewer
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReviewers.map((reviewer: Reviewer) => (
                      <TableRow key={reviewer.id}>
                        <TableCell className="font-medium">{reviewer.full_name}</TableCell>
                        <TableCell>@{reviewer.username}</TableCell>
                        <TableCell>{reviewer.email}</TableCell>
                        <TableCell>
                          {reviewer.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(reviewer.date_joined), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(reviewer)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(reviewer.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {(reviewersData?.count || 0) > ITEMS_PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(reviewerPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(reviewerPage * ITEMS_PER_PAGE, reviewersData?.count || 0)} of {reviewersData?.count || 0}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setReviewerPage(Math.max(1, reviewerPage - 1))}
                          className={reviewerPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalReviewerPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setReviewerPage(page)}
                            isActive={reviewerPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setReviewerPage(Math.min(totalReviewerPages, reviewerPage + 1))}
                          className={reviewerPage === totalReviewerPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add New {activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'}
            </DialogTitle>
            <DialogDescription>
              Create a new staff account. They can log in immediately with these credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Commissioner-specific fields */}
            {activeTab === 'commissioner' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization / Law Firm</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Smith & Associates Law Firm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_image">Profile Photo</Label>
                  <Input
                    id="profile_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, profile_image: file });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a professional photo for public display
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_number">Commission Number</Label>
                    <Input
                      id="commission_number"
                      value={formData.commission_number}
                      onChange={(e) => setFormData({ ...formData, commission_number: e.target.value })}
                      placeholder="COM-12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission_expiry">Commission Expiry</Label>
                    <Input
                      id="commission_expiry"
                      type="date"
                      value={formData.commission_expiry}
                      onChange={(e) => setFormData({ ...formData, commission_expiry: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payout_rate">Payout Rate ($)</Label>
                  <Input
                    id="payout_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.payout_rate}
                    onChange={(e) => setFormData({ ...formData, payout_rate: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Featured Commissioner</Label>
                    <p className="text-sm text-muted-foreground">
                      Show on homepage for users to select
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !formData.username || !formData.email || !formData.password}
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create {activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit {activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'}
            </DialogTitle>
            <DialogDescription>
              Update staff member details. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_password">New Password (optional)</Label>
              <div className="relative">
                <Input
                  id="edit_password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Commissioner-specific fields */}
            {activeTab === 'commissioner' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit_organization">Organization / Law Firm</Label>
                  <Input
                    id="edit_organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Smith & Associates Law Firm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_profile_image">Profile Photo</Label>
                  <Input
                    id="edit_profile_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, profile_image: file });
                    }}
                  />
                  {editingStaff && 'profile_image_url' in editingStaff && editingStaff.profile_image_url && (
                    <div className="flex items-center gap-2 mt-2">
                      <img 
                        src={editingStaff.profile_image_url} 
                        alt="Current" 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <span className="text-xs text-muted-foreground">Current photo</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_commission_number">Commission Number</Label>
                    <Input
                      id="edit_commission_number"
                      value={formData.commission_number}
                      onChange={(e) => setFormData({ ...formData, commission_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_commission_expiry">Commission Expiry</Label>
                    <Input
                      id="edit_commission_expiry"
                      type="date"
                      value={formData.commission_expiry}
                      onChange={(e) => setFormData({ ...formData, commission_expiry: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_payout_rate">Payout Rate ($)</Label>
                  <Input
                    id="edit_payout_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.payout_rate}
                    onChange={(e) => setFormData({ ...formData, payout_rate: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Featured Commissioner</Label>
                    <p className="text-sm text-muted-foreground">
                      Show on homepage for users to select
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff member's account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
