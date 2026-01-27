import { useState } from 'react';
import { useSubmitClarificationMutation } from '@/store/api/userApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Request } from '@/types';

interface ClarificationDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ClarificationDialog({ 
  request, 
  open, 
  onOpenChange,
  onSuccess 
}: ClarificationDialogProps) {
  const [response, setResponse] = useState('');
  const [submitClarification, { isLoading }] = useSubmitClarificationMutation();

  const handleSubmit = async () => {
    if (!request || !response.trim()) return;

    try {
      await submitClarification({
        id: request.id,
        response: response.trim(),
      }).unwrap();

      toast.success('Response submitted successfully');
      setResponse('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit response. Please try again.');
      console.error('Clarification submission error:', error);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Clarification Needed</DialogTitle>
          <DialogDescription>
            The AI needs some additional information to proceed with your affidavit.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-semibold mb-1">Question:</p>
            <p>{request.clarification_question || "Please provide more details about your request."}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="response" className="text-sm font-medium">
              Your Answer
            </label>
            <Textarea
              id="response"
              placeholder="Type your answer here..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!response.trim() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
