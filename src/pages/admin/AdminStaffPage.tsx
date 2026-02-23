import React, { useState } from 'react';
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
  AvailabilityScheduler,
  parseAvailability,
  emptySchedule,
  type WeeklySchedule,
} from '@/components/ui/availability-scheduler';
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
  useGetCommissionerPaymentSummaryQuery,
  useGetCommissionerPaymentHistoryQuery,
  useMarkCommissionerPaidMutation,
  useGenerateCommissionerSlotsMutation,
  type Commissioner,
  type Reviewer,
  type PaymentLog,
} from '@/store/api/adminApi';
import { useAuth } from '@/hooks/use-auth';
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
  DollarSign,
  Banknote,
  CreditCard,
  Building,
  Clock,
  RefreshCw,
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
  phone_number?: string;
  commission_number?: string;
  commission_expiry?: string;
  payout_rate?: string;
  is_featured?: boolean;
  bio?: string;
  organization?: string;
  address?: string;
  profile_image?: File | null;
  bank_name?: string;
  branch_name?: string;
  account_number?: string;
  routing_number?: string;
  availability?: WeeklySchedule;
}

const initialFormData: StaffFormData = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  commission_number: '',
  commission_expiry: '',
  payout_rate: '1.00',
  is_featured: false,
  bio: '',
  organization: '',
  address: '',
  profile_image: null,
  availability: emptySchedule,
};

export function AdminStaffPage() {
  const { user } = useAuth();
  const isSuperuser = user?.is_superuser === true;
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
  
  // Payment modal state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCommissionerId, setSelectedCommissionerId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_reference: '',
    payment_method: '',
    notes: '',
  });
  const [activePaymentTab, setActivePaymentTab] = useState<'overview' | 'history'>('overview');

  // Availability modal state
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [selectedCommissioner, setSelectedCommissioner] = useState<Commissioner | null>(null);
  const [availabilitySchedule, setAvailabilitySchedule] = useState<WeeklySchedule>(emptySchedule);

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

  // Payment API hooks
  const { data: paymentSummary, isLoading: loadingPaymentSummary } = useGetCommissionerPaymentSummaryQuery(
    selectedCommissionerId!,
    { skip: !selectedCommissionerId }
  );
  const { data: paymentHistory, isLoading: loadingPaymentHistory } = useGetCommissionerPaymentHistoryQuery(
    selectedCommissionerId!,
    { skip: !selectedCommissionerId }
  );
  const [markPaid, { isLoading: markingPaid }] = useMarkCommissionerPaidMutation();
  const [generateSlots] = useGenerateCommissionerSlotsMutation();
  const [generatingSlotsFor, setGeneratingSlotsFor] = useState<number | null>(null);

  // Debug payment history
  React.useEffect(() => {
    if (selectedCommissionerId && paymentHistory !== undefined) {
      console.log('Payment History Data:', paymentHistory);
      console.log('Payment History Results:', paymentHistory?.results);
    }
  }, [paymentHistory, selectedCommissionerId]);

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
      phone_number: 'phone_number' in staff ? (staff as any).phone_number || '' : '',
      commission_number: 'commission_number' in staff ? staff.commission_number || '' : '',
      commission_expiry: 'commission_expiry' in staff ? staff.commission_expiry || '' : '',
      payout_rate: 'payout_rate' in staff ? staff.payout_rate || '0.00' : '0.00',
      is_featured: 'is_featured' in staff ? staff.is_featured : false,
      bio: 'bio' in staff ? staff.bio || '' : '',
      organization: 'organization' in staff ? staff.organization || '' : '',
      address: 'address' in staff ? (staff as any).address || '' : '',
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
      if (formData.phone_number) formDataToSend.append('phone_number', formData.phone_number);

      if (activeTab === 'commissioner') {
        if (formData.commission_number) formDataToSend.append('commission_number', formData.commission_number);
        if (formData.commission_expiry) formDataToSend.append('commission_expiry', formData.commission_expiry);
        formDataToSend.append('is_featured', String(formData.is_featured || false));
        if (formData.bio) formDataToSend.append('bio', formData.bio);
        if (formData.organization) formDataToSend.append('organization', formData.organization);
        if (formData.address) formDataToSend.append('address', formData.address);
        if (formData.profile_image) formDataToSend.append('profile_image', formData.profile_image);
        if (formData.availability) formDataToSend.append('availability', JSON.stringify(formData.availability));
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
      if (formData.phone_number) formDataToSend.append('phone_number', formData.phone_number);

      if (activeTab === 'commissioner') {
        if (formData.commission_number) formDataToSend.append('commission_number', formData.commission_number);
        if (formData.commission_expiry) formDataToSend.append('commission_expiry', formData.commission_expiry);
        formDataToSend.append('is_featured', String(formData.is_featured || false));
        if (formData.bio) formDataToSend.append('bio', formData.bio);
        if (formData.organization) formDataToSend.append('organization', formData.organization);
        if (formData.address) formDataToSend.append('address', formData.address);
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

  // Payment handlers
  const handleOpenPaymentDialog = (commissionerId: number) => {
    setSelectedCommissionerId(commissionerId);
    setPaymentForm({ payment_reference: '', payment_method: '', notes: '' });
    setActivePaymentTab('overview');
    setShowPaymentDialog(true);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedCommissionerId) return;
    
    if (!paymentSummary || parseFloat(paymentSummary.amount_to_pay) === 0) {
      toast.error('No unpaid stamps for this commissioner. They need to complete affidavits first.');
      return;
    }

    try {
      console.log('Marking commissioner as paid:', { id: selectedCommissionerId, data: paymentForm });
      
      const result = await markPaid({
        id: selectedCommissionerId,
        data: paymentForm,
      }).unwrap();

      console.log('Payment result:', result);
      toast.success(result.detail);
      setPaymentForm({ payment_reference: '', payment_method: '', notes: '' });
      // Switch to history tab to show the new payment
      setActivePaymentTab('history');
    } catch (error: unknown) {
      console.error('Payment error:', error);
      const err = error as { data?: { detail?: string; [key: string]: unknown } };
      const message = err.data?.detail || JSON.stringify(err.data) || 'Failed to process payment';
      toast.error(message);
    }
  };

  // Availability handler
  const handleOpenAvailabilityDialog = (commissioner: Commissioner) => {
    setSelectedCommissioner(commissioner);
    const schedule = parseAvailability(commissioner.availability || {});
    setAvailabilitySchedule(schedule);
    setShowAvailabilityDialog(true);
  };

  // Generate slots handler (superuser only — fallback when cron didn't run)
  const handleGenerateSlots = async (commissionerId: number) => {
    setGeneratingSlotsFor(commissionerId);
    try {
      const result = await generateSlots({ id: commissionerId, days: 14 }).unwrap();
      toast.success(result.message || `Generated ${result.slots_created} slots successfully.`);
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      toast.error(err.data?.detail || 'Failed to generate slots. Please try again.');
    } finally {
      setGeneratingSlotsFor(null);
    }
  };

  // Stats - Calculate from actual data
  const approvedCommissioners = commissioners.filter(c => c.is_featured).length;
  const stats = {
    commissioners: commissionersData?.count || 0,
    reviewers: reviewersData?.count || 0,
    featuredCommissioners: approvedCommissioners,
    activeReviewers: reviewers.length, // All reviewers in the list are considered active
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
                <p className="text-sm text-muted-foreground">Approved Commissioners</p>
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
                      <TableHead>Availability</TableHead>
                      <TableHead>To Be Paid</TableHead>
                      <TableHead>Status</TableHead>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-medium"
                            onClick={() => handleOpenAvailabilityDialog(commissioner)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-0 h-auto font-medium"
                            onClick={() => handleOpenPaymentDialog(commissioner.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                        <TableCell>
                          {commissioner.is_featured ? (
                            <Badge variant="default">Approved</Badge>
                          ) : (
                            <Badge variant="destructive">Pending</Badge>
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
                              <DropdownMenuItem onClick={() => handleOpenAvailabilityDialog(commissioner)}>
                                <Clock className="h-4 w-4 mr-2" />
                                View Availability
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenPaymentDialog(commissioner.id)}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Payment Details
                              </DropdownMenuItem>
                              {isSuperuser && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleGenerateSlots(commissioner.id)}
                                    disabled={generatingSlotsFor === commissioner.id}
                                  >
                                    {generatingSlotsFor === commissioner.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    Generate Slots
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
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
                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Business Information</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="create_address">Business Address</Label>
                      <Input
                        id="create_address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main St, Port of Spain"
                      />
                    </div>
                  </div>
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

                {/* Commission Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Commission Details</h3>
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
                      <Label htmlFor="commission_expiry">Commission Expiry Date</Label>
                      <Input
                        id="commission_expiry"
                        type="text"
                        placeholder="DD-MMM-YYYY (e.g. 15-Sep-2026)"
                        maxLength={11}
                        value={formData.commission_expiry}
                        onChange={(e) => setFormData({ ...formData, commission_expiry: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Availability Schedule */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Availability Schedule
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Define when this commissioner is available for client appointments.
                  </p>
                  <AvailabilityScheduler
                    value={formData.availability || emptySchedule}
                    onChange={(schedule) => setFormData({ ...formData, availability: schedule })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Approve Commissioner</Label>
                    <p className="text-sm text-muted-foreground">
                      Approve this commissioner to allow login
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Edit {activeTab === 'commissioner' ? 'Commissioner' : 'Reviewer'}
            </DialogTitle>
            <DialogDescription>
              Update staff member details. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">Basic Information</h3>
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

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="edit_phone_number">Phone Number</Label>
                  <Input
                    id="edit_phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="868-123-4567"
                  />
                </div>
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
            </div>

            {/* Commissioner-specific fields */}
            {activeTab === 'commissioner' && (
              <>
                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Business Information</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="edit_address">Business Address</Label>
                      <Input
                        id="edit_address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main St, Port of Spain"
                      />
                    </div>
                  </div>
                </div>

                {/* Commission Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Commission Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_commission_number">Commission Number</Label>
                      <Input
                        id="edit_commission_number"
                        value={formData.commission_number}
                        onChange={(e) => setFormData({ ...formData, commission_number: e.target.value })}
                        placeholder="C12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_commission_expiry">Commission Expiry Date</Label>
                      <Input
                        id="edit_commission_expiry"
                        type="text"
                        placeholder="DD-MMM-YYYY (e.g. 15-Sep-2026)"
                        maxLength={11}
                        value={formData.commission_expiry}
                        onChange={(e) => setFormData({ ...formData, commission_expiry: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Profile & Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Profile & Settings</h3>
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

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label>Approve Commissioner</Label>
                      <p className="text-sm text-muted-foreground">
                        Approve this commissioner to allow login
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                  </div>
                </div>

                {/* Banking Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Banking Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_bank_name">Bank Name</Label>
                      <Input
                        id="edit_bank_name"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="First Citizens Bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_branch_name">Branch Name</Label>
                      <Input
                        id="edit_branch_name"
                        value={formData.branch_name}
                        onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                        placeholder="Main Branch"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_account_number">Account Number</Label>
                      <Input
                        id="edit_account_number"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_routing_number">Routing/Transit Number</Label>
                      <Input
                        id="edit_routing_number"
                        value={formData.routing_number}
                        onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                        placeholder="123456789"
                      />
                    </div>
                  </div>
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

      {/* Payment Modal */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Commissioner Payments
              {paymentSummary && (
                <span className="text-muted-foreground font-normal text-base ml-2">
                  - {paymentSummary.full_name}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              View payment details and process payments for this commissioner
            </DialogDescription>
          </DialogHeader>

          {loadingPaymentSummary ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : paymentSummary && (
            <Tabs value={activePaymentTab} onValueChange={(v) => setActivePaymentTab(v as 'overview' | 'history')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="history">Payment History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Payment Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">${paymentSummary.amount_to_pay}</p>
                          <p className="text-sm text-muted-foreground">To Be Paid ({paymentSummary.unpaid_stamps_count} affidavits)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Banknote className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">${paymentSummary.total_paid}</p>
                          <p className="text-sm text-muted-foreground">Total Paid Out</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Banking Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Banking Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{paymentSummary.bank_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{paymentSummary.bank_branch || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-medium">{paymentSummary.bank_account_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Name</p>
                      <p className="font-medium">{paymentSummary.bank_account_name || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Payment Preference</p>
                      <p className="font-medium capitalize">{paymentSummary.payment_preference?.replace('_', ' ') || 'Bank Transfer'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Mark as Paid Form */}
                {parseFloat(paymentSummary.amount_to_pay) > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Process Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment_method">Payment Method</Label>
                          <Input
                            id="payment_method"
                            value={paymentForm.payment_method}
                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                            placeholder="e.g., Bank Transfer, Cheque"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment_reference">Reference Number</Label>
                          <Input
                            id="payment_reference"
                            value={paymentForm.payment_reference}
                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                            placeholder="e.g., TXN-123456"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_notes">Notes (Optional)</Label>
                        <Input
                          id="payment_notes"
                          value={paymentForm.notes}
                          onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                          placeholder="Any additional notes about this payment"
                        />
                      </div>
                      <Button 
                        onClick={handleMarkAsPaid} 
                        disabled={markingPaid}
                        className="w-full"
                      >
                        {markingPaid && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Mark ${paymentSummary.amount_to_pay} as Paid ({paymentSummary.unpaid_stamps_count} affidavits)
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {parseFloat(paymentSummary.amount_to_pay) === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending payments for this commissioner</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                {loadingPaymentHistory ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : paymentHistory?.results && paymentHistory.results.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Affidavits</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Paid By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.results.map((payment: PaymentLog) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.paid_at), 'MMM d, yyyy h:mm a')}</TableCell>
                          <TableCell className="font-medium text-green-600">${payment.amount_paid}</TableCell>
                          <TableCell>{payment.stamps_count}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {payment.payment_reference || '-'}
                            </code>
                          </TableCell>
                          <TableCell>{payment.paid_by_name || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payment history for this commissioner</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability Modal */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Availability Schedule
              {selectedCommissioner && (
                <span className="text-muted-foreground font-normal text-base ml-2">
                  - {selectedCommissioner.full_name}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              View when this commissioner is available for appointments
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <AvailabilityScheduler
              value={availabilitySchedule}
              onChange={() => {}}
              readOnly
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
