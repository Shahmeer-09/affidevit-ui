import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ListChecks, Eye } from 'lucide-react';

interface DraftPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftHtml: string;
  onSchedule: () => void;
  answers?: Record<string, unknown>;
}

export function DraftPreviewModal({ isOpen, onClose, draftHtml, onSchedule, answers }: DraftPreviewModalProps) {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const normalizeDraftToHtml = (value: string) => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      return '<p class="text-muted-foreground">No draft content available.</p>';
    }

    const looksLikeHtml =
      /<\s*(p|div|br|ol|ul|li|strong|em|table|thead|tbody|tr|td|th|h[1-6]|blockquote|section|article|span)\b/i.test(
        trimmed
      );

    if (looksLikeHtml) {
      return trimmed;
    }

    const escaped = escapeHtml(trimmed);
    const paragraphs = escaped
      .split(/\n{2,}/g)
      .map((p) => p.replace(/\n/g, '<br/>'))
      .map((p) => `<p>${p}</p>`)
      .join('');

    return paragraphs || `<p>${escaped}</p>`;
  };

  const htmlToRender = normalizeDraftToHtml(draftHtml);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-none h-[94vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-background z-10">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Affidavit Draft Preview
          </DialogTitle>
          <DialogDescription>
            Review the generated legal document below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-muted/30 min-h-0">
          <Tabs defaultValue="document" className="h-full flex flex-col">
            <div className="px-6 py-2 border-b bg-background">
              <TabsList>
                <TabsTrigger value="document" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Document View
                </TabsTrigger>
                <TabsTrigger value="answers" className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Your Answers
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="document" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                  <div
                    className="document-preview bg-white dark:bg-gray-900 border rounded-lg p-10 min-h-[900px] shadow-sm prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlToRender }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="answers" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Your Inputs</h3>
                      {answers && Object.entries(answers).length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {Object.entries(answers).map(([key, value]) => (
                            <div key={key} className="space-y-1 pb-3 border-b last:border-0">
                              <p className="text-sm font-medium text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm font-medium">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No answers available to display.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background sm:justify-between gap-4">
           <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
          <Button onClick={onSchedule} size="lg" className="w-full sm:w-auto">
            Proceed to Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
