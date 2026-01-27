import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DashboardHeader } from '@/components/features';
import {
  useGetAdminDecisionTreeNodesQuery,
  useGetAdminAffidavitTypesQuery,
  useCreateAdminDecisionTreeNodeMutation,
  useUpdateAdminDecisionTreeNodeMutation,
  useDeleteAdminDecisionTreeNodeMutation,
} from '@/store/api/adminApi';
import type { AdminDecisionTreeNode, AdminDecisionTreeNodeCreate } from '@/types';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Loader2,
  GitBranch,
  HelpCircle,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  question_text: string;
  help_text: string;
  answer_value: string;
  parent_node: number | null;
  result_affidavit_type: number | null;
  order: number;
  is_active: boolean;
}

const defaultFormData: FormData = {
  question_text: '',
  help_text: '',
  answer_value: '',
  parent_node: null,
  result_affidavit_type: null,
  order: 0,
  is_active: true,
};

export function AdminDecisionTreePage() {
  // API hooks
  const { data: nodes, isLoading: isLoadingNodes } = useGetAdminDecisionTreeNodesQuery();
  const { data: affidavitTypes } = useGetAdminAffidavitTypesQuery();
  const [createNode, { isLoading: isCreating }] = useCreateAdminDecisionTreeNodeMutation();
  const [updateNode, { isLoading: isUpdating }] = useUpdateAdminDecisionTreeNodeMutation();
  const [deleteNode, { isLoading: isDeleting }] = useDeleteAdminDecisionTreeNodeMutation();

  // UI state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<AdminDecisionTreeNode | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  // Get root nodes (no parent)
  const rootNodes = nodes?.filter(n => !n.parent_node_id) || [];
  
  // Get children of a node
  const getChildren = (parentId: number) => 
    nodes?.filter(n => n.parent_node_id === parentId) || [];

  // Get question nodes (non-leaf nodes for parent selection)
  const questionNodes = nodes?.filter(n => !n.is_leaf) || [];

  const handleOpenCreate = (parentId?: number) => {
    setEditingNode(null);
    setFormData({
      ...defaultFormData,
      parent_node: parentId || null,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (node: AdminDecisionTreeNode) => {
    setEditingNode(node);
    setFormData({
      question_text: node.question_text,
      help_text: node.help_text || '',
      answer_value: node.answer_value || '',
      parent_node: node.parent_node_id || null,
      result_affidavit_type: node.result_affidavit_type_id || null,
      order: node.order,
      is_active: node.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation: question_text required ONLY if it's a question node (no result type)
    const isResultNode = !!formData.result_affidavit_type;
    
    if (!isResultNode && !formData.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (isResultNode && !formData.answer_value.trim()) {
      toast.error('Result nodes must have an answer label');
      return;
    }

    // If it's a result node, requires parent
    if (isResultNode && !formData.parent_node) {
      toast.error('Root questions cannot directly lead to affidavit types. First create a question, then add an answer that points to the type.');
      return;
    }

    const data: AdminDecisionTreeNodeCreate = {
      question_text: formData.question_text.trim(),
      help_text: formData.help_text.trim() || undefined,
      answer_value: formData.answer_value.trim() || undefined,
      parent_node: formData.parent_node,
      result_affidavit_type: formData.result_affidavit_type,
      order: formData.order,
      is_active: formData.is_active,
    };

    try {
      if (editingNode) {
        await updateNode({ id: editingNode.id, data }).unwrap();
        toast.success('Node updated successfully');
      } else {
        await createNode(data).unwrap();
        toast.success('Node created successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(editingNode ? 'Failed to update node' : 'Failed to create node');
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (nodeId: number) => {
    try {
      await deleteNode(nodeId).unwrap();
      toast.success('Node deleted successfully');
    } catch (error) {
      toast.error('Failed to delete node');
      console.error('Delete error:', error);
    }
  };

  const isSaving = isCreating || isUpdating;

  if (isLoadingNodes) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Decision Tree"
        description="Manage the 'Help Me Choose' decision tree that guides users to the right affidavit type"
      >
        <Button onClick={() => handleOpenCreate()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Root Question
        </Button>
      </DashboardHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{questionNodes.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {nodes?.filter(n => n.is_leaf).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Result Nodes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rootNodes.length}</p>
                <p className="text-sm text-muted-foreground">Root Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tree View */}
      <Card>
        <CardHeader>
          <CardTitle>Decision Tree Structure</CardTitle>
          <CardDescription>
            The tree shows questions and their possible answers. 
            Answers can lead to more questions or directly to an affidavit type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rootNodes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Decision Tree</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding the first question users will see.
              </p>
              <Button onClick={() => handleOpenCreate()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rootNodes.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  getChildren={getChildren}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onAddChild={(parentId) => handleOpenCreate(parentId)}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Edit Node' : 'Add Node'}
            </DialogTitle>
            <DialogDescription>
              {formData.parent_node
                ? 'Create an answer option for the parent question.'
                : 'Create a root question that users see first.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formData.parent_node && (
              <div className="space-y-2">
                <Label>Parent Question</Label>
                <Select
                  value={formData.parent_node?.toString() || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, parent_node: v === 'none' ? null : parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent question..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root Question)</SelectItem>
                    {questionNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id.toString()}>
                        {node.question_text.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.parent_node && (
              <div className="space-y-2">
                <Label htmlFor="answer_value">Answer Label *</Label>
                <Input
                  id="answer_value"
                  value={formData.answer_value}
                  onChange={(e) => setFormData({ ...formData, answer_value: e.target.value })}
                  placeholder="e.g., 'Estate or Inheritance Matter'"
                />
                <p className="text-xs text-muted-foreground">
                  The option text users click to reach this node.
                </p>
              </div>
            )}

            {!formData.result_affidavit_type && (
              <div className="space-y-2">
                <Label htmlFor="question_text">
                  Question Text *
                </Label>
                <Textarea
                  id="question_text"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder={formData.parent_node 
                    ? "e.g., 'What type of estate matter?'" 
                    : "e.g., 'What do you need the affidavit for?'"}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  The follow-up question users will see after clicking this answer.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="help_text">Help Text (Optional)</Label>
              <Textarea
                id="help_text"
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="Additional explanation shown below the question..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Result Affidavit Type (Optional)</Label>
              <Select
                value={formData.result_affidavit_type?.toString() || 'none'}
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  result_affidavit_type: v === 'none' ? null : parseInt(v) 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (this is a question node)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Question Node)</SelectItem>
                  {affidavitTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If set, this becomes a result node that leads to an affidavit type.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="flex items-center justify-between space-y-0 pt-6">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingNode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tree Node Component
interface TreeNodeProps {
  node: AdminDecisionTreeNode;
  depth: number;
  getChildren: (parentId: number) => AdminDecisionTreeNode[];
  onEdit: (node: AdminDecisionTreeNode) => void;
  onDelete: (nodeId: number) => void;
  onAddChild: (parentId: number) => void;
  isDeleting: boolean;
}

function TreeNode({
  node,
  depth,
  getChildren,
  onEdit,
  onDelete,
  onAddChild,
  isDeleting,
}: TreeNodeProps) {
  const children = getChildren(node.id);
  const isLeaf = node.is_leaf;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 pl-4' : ''}`}>
      <div className={`
        flex items-center justify-between p-4 rounded-lg border
        ${isLeaf ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-card'}
        ${!node.is_active ? 'opacity-50' : ''}
      `}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isLeaf ? (
              <FileText className="h-4 w-4 text-green-600" />
            ) : (
              <MessageSquare className="h-4 w-4 text-primary" />
            )}
            <span className="font-medium">
              {node.answer_value || node.question_text}
            </span>
            {!node.is_active && (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
          
          {node.answer_value && !isLeaf && (
            <p className="text-sm text-muted-foreground mt-1">
              <ChevronRight className="h-3 w-3 inline" /> {node.question_text}
            </p>
          )}
          
          {isLeaf && node.result_affidavit_type_name && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              → {node.result_affidavit_type_name}
            </p>
          )}
          
          {node.help_text && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              💡 {node.help_text}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 ml-4">
          {!isLeaf && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onAddChild(node.id)}
              title="Add answer option"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onEdit(node)}>
            <Pencil className="h-4 w-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Node?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete this node and all its children. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(node.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Render children */}
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              getChildren={getChildren}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
