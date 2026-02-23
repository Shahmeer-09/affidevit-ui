import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import type { IntakeQuestion } from '@/store/api/adminApi';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

const QUESTION_TYPES: { value: IntakeQuestion['type']; label: string; hasOptions: boolean }[] = [
  { value: 'text', label: 'Short Text', hasOptions: false },
  { value: 'textarea', label: 'Long Text', hasOptions: false },
  { value: 'email', label: 'Email', hasOptions: false },
  { value: 'phone', label: 'Phone', hasOptions: false },
  { value: 'number', label: 'Number', hasOptions: false },
  { value: 'date', label: 'Date', hasOptions: false },
  { value: 'select', label: 'Dropdown', hasOptions: true },
  { value: 'radio', label: 'Radio Buttons', hasOptions: true },
  { value: 'checkbox', label: 'Checkboxes', hasOptions: true },
];

interface QuestionBuilderProps {
  questions: IntakeQuestion[];
  onChange: (questions: IntakeQuestion[]) => void;
  allowAdd?: boolean;
}

const generateId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultQuestion: Omit<IntakeQuestion, 'id'> = {
  type: 'text',
  label: '',
  field_name: '',
  placeholder: '',
  required: true,
  options: [],
  help_text: '',
};

// Sortable row component
function SortableRow({
  question,
  index,
  questions,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  question: IntakeQuestion;
  index: number;
  questions: IntakeQuestion[];
  onEdit: (q: IntakeQuestion) => void;
  onDuplicate: (q: IntakeQuestion) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted shadow-lg' : ''}>
      <TableCell>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{question.label}</p>
          {question.placeholder && (
            <p className="text-xs text-muted-foreground">{question.placeholder}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {QUESTION_TYPES.find((t) => t.value === question.type)?.label || question.type}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        {question.required ? (
          <Badge variant="default" className="text-xs">Yes</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">No</Badge>
        )}
      </TableCell>
      <TableCell>
        {question.show_if && (
          <Badge variant="outline" className="text-xs">
            If Q{questions.findIndex((q) => q.id === question.show_if?.field) + 1}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDuplicate(question)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(question)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(question.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function QuestionBuilder({ questions, onChange, allowAdd = false }: QuestionBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<IntakeQuestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewQuestion, setIsNewQuestion] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    onChange(arrayMove(questions, oldIndex, newIndex));
  };

  const handleAddQuestion = () => {
    setEditingQuestion({ ...defaultQuestion, id: generateId() });
    setIsNewQuestion(true);
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (question: IntakeQuestion) => {
    const questionWithId = question.id ? { ...question } : { ...question, id: generateId() };
    setEditingQuestion(questionWithId);
    setIsNewQuestion(false);
    setIsDialogOpen(true);
  };

  const handleDeleteQuestion = (id: string) => {
    const updatedQuestions = questions
      .filter((q) => q.id !== id)
      .map((q) => {
        if (q.show_if?.field === id) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { show_if: _, ...rest } = q;
          return rest;
        }
        return q;
      });
    onChange(updatedQuestions);
  };

  const handleDuplicateQuestion = (question: IntakeQuestion) => {
    const duplicate: IntakeQuestion = {
      ...question,
      id: generateId(),
      label: `${question.label} (Copy)`,
    };
    const index = questions.findIndex((q) => q.id === question.id);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicate);
    onChange(newQuestions);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion || !editingQuestion.label.trim()) return;
    if (isNewQuestion) {
      onChange([...questions, editingQuestion]);
    } else {
      onChange(questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q)));
    }
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleQuestionChange = <K extends keyof IntakeQuestion>(field: K, value: IntakeQuestion[K]) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, [field]: value });
  };

  const hasOptionsType = editingQuestion
    ? QUESTION_TYPES.find((t) => t.value === editingQuestion.type)?.hasOptions
    : false;

  const otherQuestions = questions.filter((q) => q.id !== editingQuestion?.id);

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">No questions defined yet</p>
          <Button onClick={handleAddQuestion}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Question
          </Button>
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="w-32">Type</TableHead>
                    <TableHead className="w-24 text-center">Required</TableHead>
                    <TableHead className="w-32">Condition</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question, index) => (
                    <SortableRow
                      key={question.id}
                      question={question}
                      index={index}
                      questions={questions}
                      onEdit={handleEditQuestion}
                      onDuplicate={handleDuplicateQuestion}
                      onDelete={handleDeleteQuestion}
                    />
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>

          {allowAdd && (
            <Button onClick={handleAddQuestion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          )}
        </>
      )}

      {/* Question Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNewQuestion ? 'Add Question' : 'Edit Question'}</DialogTitle>
            <DialogDescription>Configure the question settings and conditional logic</DialogDescription>
          </DialogHeader>

          {editingQuestion && (
            <div className="space-y-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="q-type">Question Type *</Label>
                  <Select
                    value={editingQuestion.type}
                    onValueChange={(v) => handleQuestionChange('type', v as IntakeQuestion['type'])}
                  >
                    <SelectTrigger id="q-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="q-id">Field ID</Label>
                  <Input
                    id="q-id"
                    value={editingQuestion.id}
                    onChange={(e) => handleQuestionChange('id', e.target.value.replace(/\s/g, '_').toLowerCase())}
                    placeholder="e.g., full_name"
                  />
                  <p className="text-xs text-muted-foreground">Used for conditional logic references</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="q-field-name">Template Field Name</Label>
                <Input
                  id="q-field-name"
                  value={editingQuestion.field_name || editingQuestion.id}
                  onChange={(e) => handleQuestionChange('field_name', e.target.value.replace(/\s/g, '_').toLowerCase())}
                  placeholder="e.g., declarant_name"
                />
                <p className="text-xs text-muted-foreground">
                  Used in templates as {'{{field_name}}'} - defaults to Field ID if empty
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="q-label">Label *</Label>
                <Input
                  id="q-label"
                  value={editingQuestion.label}
                  onChange={(e) => handleQuestionChange('label', e.target.value)}
                  placeholder="e.g., What is your full legal name?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="q-placeholder">Placeholder</Label>
                <Input
                  id="q-placeholder"
                  value={editingQuestion.placeholder || ''}
                  onChange={(e) => handleQuestionChange('placeholder', e.target.value)}
                  placeholder="e.g., John Michael Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="q-help">Help Text</Label>
                <Input
                  id="q-help"
                  value={editingQuestion.help_text || ''}
                  onChange={(e) => handleQuestionChange('help_text', e.target.value)}
                  placeholder="Additional instructions for the user"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required</Label>
                  <p className="text-xs text-muted-foreground">User must answer this question</p>
                </div>
                <Switch
                  checked={editingQuestion.required}
                  onCheckedChange={(v) => handleQuestionChange('required', v)}
                />
              </div>

              {hasOptionsType && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = [...(editingQuestion.options || []), { value: '', label: '' }];
                          handleQuestionChange('options', newOptions);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </Button>
                    </div>

                    {(!editingQuestion.options || editingQuestion.options.length === 0) ? (
                      <div className="text-center py-4 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">No options yet. Click "Add Option" to create choices.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editingQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                            <div className="flex-1">
                              <Input
                                placeholder="Option label (e.g., Alive, Deceased)"
                                value={option.label}
                                onChange={(e) => {
                                  const label = e.target.value;
                                  const value = label.toLowerCase().replace(/\s+/g, '_');
                                  const newOptions = [...editingQuestion.options!];
                                  newOptions[index] = { value, label };
                                  handleQuestionChange('options', newOptions);
                                }}
                              />
                              <p className="text-xs text-muted-foreground mt-1">Stored as: {option.value || '(auto-generated)'}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                const newOptions = editingQuestion.options!.filter((_, i) => i !== index);
                                handleQuestionChange('options', newOptions);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enter option labels - values are auto-generated (lowercase with underscores)
                    </p>
                  </div>
                </>
              )}

              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Conditional Display</Label>
                    <p className="text-xs text-muted-foreground">Only show this question based on another answer</p>
                  </div>
                  <Switch
                    checked={!!editingQuestion.show_if}
                    onCheckedChange={(v) => {
                      if (v && otherQuestions.length > 0) {
                        handleQuestionChange('show_if', { field: otherQuestions[0].id, value: '' });
                      } else {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { show_if: _, ...rest } = editingQuestion;
                        setEditingQuestion(rest as IntakeQuestion);
                      }
                    }}
                    disabled={otherQuestions.length === 0}
                  />
                </div>

                {editingQuestion.show_if && otherQuestions.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label>Show when this question...</Label>
                      <Select
                        value={editingQuestion.show_if.field}
                        onValueChange={(v) => handleQuestionChange('show_if', { ...editingQuestion.show_if!, field: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select question" />
                        </SelectTrigger>
                        <SelectContent>
                          {otherQuestions.map((q) => (
                            <SelectItem key={q.id} value={q.id}>
                              Q{questions.findIndex((oq) => oq.id === q.id) + 1}: {q.label.slice(0, 30)}{q.label.length > 30 ? '...' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>...has this value</Label>
                      {(() => {
                        const conditionQuestion = questions.find((q) => q.id === editingQuestion.show_if?.field);
                        const conditionHasOptions = conditionQuestion && ['select', 'radio', 'checkbox'].includes(conditionQuestion.type);

                        if (conditionHasOptions && conditionQuestion?.options?.length) {
                          return (
                            <Select
                              value={Array.isArray(editingQuestion.show_if.value) ? editingQuestion.show_if.value[0] : editingQuestion.show_if.value}
                              onValueChange={(v) => handleQuestionChange('show_if', { ...editingQuestion.show_if!, value: v })}
                            >
                              <SelectTrigger><SelectValue placeholder="Select value" /></SelectTrigger>
                              <SelectContent>
                                {conditionQuestion.options.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        }

                        return (
                          <Input
                            value={Array.isArray(editingQuestion.show_if.value) ? editingQuestion.show_if.value.join(', ') : editingQuestion.show_if.value}
                            onChange={(e) => handleQuestionChange('show_if', { ...editingQuestion.show_if!, value: e.target.value })}
                            placeholder="Expected answer (or leave empty for any answer)"
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} disabled={!editingQuestion?.label.trim()}>
              {isNewQuestion ? 'Add Question' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
