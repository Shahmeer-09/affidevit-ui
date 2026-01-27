import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  useGetAffidavitTypeDecisionPathsQuery,
  useGetAdminDecisionTreeQuestionsQuery,
  useCreateDecisionNodeForTypeMutation,
  useUpdateAdminDecisionTreeNodeMutation,
  useDeleteAdminDecisionTreeNodeMutation,
} from '@/store/api/adminApi';
import type { DecisionTreePath } from '@/types';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Loader2,
  HelpCircle,
  GitBranch,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface DecisionTreeEditorProps {
  affidavitTypeId: string;
}

interface FormData {
  question_text: string;
  help_text: string;
  answer_value: string;
  parent_node: number | null;
  order: number;
}

const defaultFormData: FormData = {
  question_text: '',
  help_text: '',
  answer_value: '',
  parent_node: null,
  order: 0,
};

export function DecisionTreeEditor({ affidavitTypeId }: DecisionTreeEditorProps) {
  const typeId = parseInt(affidavitTypeId);
  
  // API hooks
  const { data: pathsData, isLoading: isLoadingPaths } = useGetAffidavitTypeDecisionPathsQuery(typeId);
  const { data: questionNodes, isLoading: isLoadingQuestions } = useGetAdminDecisionTreeQuestionsQuery();
  const [createNode, { isLoading: isCreating }] = useCreateDecisionNodeForTypeMutation();
  const [updateNode, { isLoading: isUpdating }] = useUpdateAdminDecisionTreeNodeMutation();
  const [deleteNode, { isLoading: isDeleting }] = useDeleteAdminDecisionTreeNodeMutation();
  
  // UI state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<DecisionTreePath | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  
  const handleOpenCreate = () => {
    setEditingNode(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };
  
  const handleOpenEdit = (path: DecisionTreePath) => {
    setEditingNode(path);
    setFormData({
      question_text: '', // Not editable from here - only the answer node
      help_text: path.help_text || '',
      answer_value: path.answer_label || '',
      parent_node: path.path.length > 1 ? path.path[path.path.length - 2].id : null,
      order: path.order,
    });
    setIsDialogOpen(true);
  };
  
  const handleSave = async () => {
    if (!formData.answer_value.trim()) {
      toast.error('Answer label is required');
      return;
    }
    if (!formData.parent_node) {
      toast.error('Please select a parent question');
      return;
    }
    
    try {
      if (editingNode) {
        // Update existing node
        await updateNode({
          id: editingNode.node_id,
          data: {
            answer_value: formData.answer_value.trim(),
            help_text: formData.help_text.trim() || undefined,
            order: formData.order,
          },
        }).unwrap();
        toast.success('Path updated successfully');
      } else {
        // Create new node
        await createNode({
          affidavitTypeId: typeId,
          data: {
            question_text: formData.answer_value.trim(), // For result nodes, question_text is the answer label
            help_text: formData.help_text.trim() || undefined,
            answer_value: formData.answer_value.trim(),
            parent_node: formData.parent_node,
            order: formData.order,
          },
        }).unwrap();
        toast.success('Path created successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(editingNode ? 'Failed to update path' : 'Failed to create path');
      console.error('Save error:', error);
    }
  };
  
  const handleDelete = async (nodeId: number) => {
    try {
      await deleteNode(nodeId).unwrap();
      toast.success('Path removed successfully');
    } catch (error) {
      toast.error('Failed to remove path');
      console.error('Delete error:', error);
    }
  };
  
  const isSaving = isCreating || isUpdating;
  const paths = pathsData?.paths || [];
  const hasQuestions = questionNodes && questionNodes.length > 0;
  
  if (isLoadingPaths) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Help Me Choose Paths
          </CardTitle>
          <CardDescription>
            Configure how users discover this affidavit type through the decision tree.
            Each path represents a route users can take to reach this type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paths.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Discovery Paths</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This affidavit type is not linked to the "Help Me Choose" decision tree.
                Add a path so users can discover it.
              </p>
              {!isLoadingQuestions && !hasQuestions ? (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Note:</strong> No decision tree questions exist yet. 
                    You'll need to create root questions first in the decision tree management section.
                  </p>
                </div>
              ) : null}
              <Button onClick={handleOpenCreate} disabled={!hasQuestions}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Path
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paths.map((path) => (
                  <PathItem
                    key={path.node_id}
                    path={path}
                    onEdit={() => handleOpenEdit(path)}
                    onDelete={() => handleDelete(path.node_id)}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
              
              <Button variant="outline" onClick={handleOpenCreate} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Path
              </Button>
            </>
          )}
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Tip:</p>
                <p>
                  Each path shows the question → answer sequence users follow. 
                  You can have multiple paths leading to the same affidavit type.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Edit Discovery Path' : 'Add Discovery Path'}
            </DialogTitle>
            <DialogDescription>
              Configure how users find this affidavit type in the decision tree.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parent Question *</Label>
              <Select
                value={formData.parent_node?.toString() || ''}
                onValueChange={(v) => setFormData({ ...formData, parent_node: parseInt(v) })}
                disabled={!!editingNode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select the question that leads here..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingQuestions ? (
                    <div className="p-2 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : questionNodes && questionNodes.length > 0 ? (
                    questionNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id.toString()}>
                        <div className="flex flex-col">
                          <span>{node.question_text}</span>
                          {node.parent_question && (
                            <span className="text-xs text-muted-foreground">
                              Under: {node.parent_question}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground text-xs">
                      No questions available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {editingNode && (
                <p className="text-xs text-muted-foreground">
                  Parent question cannot be changed. Delete and recreate to change.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="answer_value">Answer Label *</Label>
              <Input
                id="answer_value"
                value={formData.answer_value}
                onChange={(e) => setFormData({ ...formData, answer_value: e.target.value })}
                placeholder="e.g., 'I need to verify my identity'"
              />
              <p className="text-xs text-muted-foreground">
                This is the option text users click to reach this affidavit type.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="help_text">Help Text (Optional)</Label>
              <Textarea
                id="help_text"
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="Additional explanation shown to users..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the list.
              </p>
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
    </>
  );
}

// Path Item Component
interface PathItemProps {
  path: DecisionTreePath;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function PathItem({ path, onEdit, onDelete, isDeleting }: PathItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex-1 min-w-0">
        {/* Path visualization */}
        <div className="flex flex-wrap items-center gap-1 text-sm">
          {path.path.map((step, index) => (
            <span key={step.id} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
              )}
              <Badge
                variant={index === path.path.length - 1 ? 'default' : 'secondary'}
                className="truncate max-w-48"
              >
                {step.answer_value || step.question_text}
              </Badge>
            </span>
          ))}
        </div>
        
        {/* Help text preview */}
        {path.help_text && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            💡 {path.help_text}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit}>
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
              <AlertDialogTitle>Remove Path?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this discovery path from the decision tree.
                Users will no longer be able to find this affidavit type via this route.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
