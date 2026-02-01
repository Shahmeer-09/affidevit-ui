import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DashboardHeader, TierBadge } from '@/components/features';
import { Skeleton } from '@/components/ui/skeleton';
import { TIER_CONFIG } from '@/lib/constants';
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
  useGetAdminAffidavitTypesQuery,
  useUpdateAffidavitTypeMutation,
  useDeleteAffidavitTypeMutation,
  useDuplicateAffidavitTypeMutation,
} from '@/store/api/adminApi';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  MoreHorizontal,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  List,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminTypesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTypeId, setDeleteTypeId] = useState<number | null>(null);

  // API hooks
  const { data: typesData, isLoading, isError, refetch } = useGetAdminAffidavitTypesQuery();
  const [updateType, { isLoading: isUpdating }] = useUpdateAffidavitTypeMutation();
  const [deleteType, { isLoading: isDeleting }] = useDeleteAffidavitTypeMutation();
  const [duplicateType] = useDuplicateAffidavitTypeMutation();

  // Ensure types is always an array
  const types = Array.isArray(typesData) ? typesData : [];

  // Debug log
  if (typesData && !Array.isArray(typesData)) {
    console.warn('Unexpected types data format:', typesData);
  }

  const filteredTypes = types.filter(
    (type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = async (typeId: number, currentValue: boolean) => {
    try {
      await updateType({
        id: typeId,
        data: { is_active: !currentValue },
      }).unwrap();
      toast.success(`Type ${currentValue ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Failed to update type status');
    }
  };

  const handleToggleHomepage = async (typeId: number, currentValue: boolean) => {
    try {
      await updateType({
        id: typeId,
        data: { enabled_on_homepage: !currentValue },
      }).unwrap();
      toast.success(`Homepage visibility ${currentValue ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to update homepage visibility');
    }
  };

  const handleDuplicate = async (typeId: number) => {
    try {
      const duplicated = await duplicateType(typeId).unwrap();
      toast.success(`Created copy: ${duplicated.name}`);
      navigate(`/admin/affidavit-types/${duplicated.id}`);
    } catch (error) {
      toast.error('Failed to duplicate type');
    }
  };

  const handleDelete = async () => {
    if (!deleteTypeId) return;
    try {
      await deleteType(deleteTypeId).unwrap();
      toast.success('Affidavit type deleted');
      setDeleteTypeId(null);
    } catch (error) {
      toast.error('Failed to delete type');
    }
  };

  const stats = {
    total: types.length,
    active: types.filter((t) => t.is_active).length,
    featured: types.filter((t) => t.enabled_on_homepage).length,
    byTier: Object.entries(TIER_CONFIG).map(([tier]) => ({
      tier,
      count: types.filter((t) => t.tier === tier).length,
    })),
  };

  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load affidavit types</h3>
            <p className="text-muted-foreground mb-4">Please try again later</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Affidavit Types"
        description="Manage affidavit types, intake questions, and AI configuration"
      >
        <Button onClick={() => navigate('/admin/affidavit-types/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </DashboardHeader>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.featured}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Types Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No matching types found' : 'No affidavit types yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first affidavit type to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/admin/affidavit-types/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Version</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((type) => (
                  <TableRow
                    key={type.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/affidavit-types/${type.id}`)}
                  >
                    <TableCell className="max-w-[360px]">
                      <div className="min-w-0">
                        <p className="font-medium line-clamp-1 break-words">{type.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 break-words">
                          {type.description || 'No description'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <TierBadge tier={type.tier} size="sm" />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Badge variant="secondary">{type.default_mode.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {type.questions_count}
                    </TableCell>
                    <TableCell className="text-right">v{type.policy_version}</TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={type.enabled_on_homepage}
                        onCheckedChange={() =>
                          handleToggleHomepage(type.id, type.enabled_on_homepage)
                        }
                        disabled={isUpdating}
                      />
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={() => handleToggleActive(type.id, type.is_active)}
                        disabled={isUpdating}
                      />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/affidavit-types/${type.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/affidavit-types/${type.id}/requests`)}
                          >
                            <List className="h-4 w-4 mr-2" />
                            View Requests
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(type.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTypeId(type.id)}
                            className="text-destructive focus:text-destructive"
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTypeId} onOpenChange={() => setDeleteTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Affidavit Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this affidavit type? If there are existing requests
              using this type, it will be deactivated instead of deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
