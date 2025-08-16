
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, AlertTriangle, RotateCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Knowledge {
  id: string;
  question: string;
  answer: string;
}

export function ChatbotTraining() {
  const [knowledgeBase, setKnowledgeBase] = useState<Knowledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentKnowledge, setCurrentKnowledge] = useState<Partial<Knowledge>>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchKnowledgeBase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getDb();
      const knowledgeCollection = collection(db, "ashwani", "data", "knowledge_base");
      const snapshot = await getDocs(knowledgeCollection);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Knowledge[];
      setKnowledgeBase(list);
    } catch (err: any) {
      console.error("Firestore Error: ", err);
      const errorMessage = `Failed to fetch knowledge base. Please check Firestore security rules for 'ashwani/data/knowledge_base'. Error: ${err.message}`;
      setError(errorMessage);
      toast({ title: 'Error Fetching Data', description: errorMessage, variant: 'destructive', duration: 10000 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const handleSave = async () => {
    if (!currentKnowledge.question || !currentKnowledge.answer) {
      toast({ title: 'Error', description: 'Question and Answer fields cannot be empty.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const db = getDb();
      const knowledgeCollection = collection(db, "ashwani", "data", "knowledge_base");
      const dataToSave = {
        question: currentKnowledge.question,
        answer: currentKnowledge.answer,
      };

      if (isEditMode && currentKnowledge.id) {
        const docRef = doc(knowledgeCollection, currentKnowledge.id);
        await updateDoc(docRef, dataToSave);
        toast({ title: 'Success', description: 'Knowledge entry updated successfully.' });
      } else {
        await addDoc(knowledgeCollection, dataToSave);
        toast({ title: 'Success', description: 'New knowledge entry added.' });
      }
      await fetchKnowledgeBase();
      setIsDialogOpen(false);
      setCurrentKnowledge({});
    } catch (error: any) {
      toast({ 
        title: 'Save Failed', 
        description: error.code === 'permission-denied' 
          ? 'Permission Denied. Please check your Firestore security rules.' 
          : 'Failed to save knowledge entry.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const db = getDb();
    try {
      await deleteDoc(doc(db, "ashwani", "data", "knowledge_base", id));
      toast({ title: 'Success', description: 'Knowledge entry deleted successfully.' });
      await fetchKnowledgeBase();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete entry.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (knowledge?: Knowledge) => {
    if (knowledge) {
      setIsEditMode(true);
      setCurrentKnowledge(knowledge);
    } else {
      setIsEditMode(false);
      setCurrentKnowledge({ question: '', answer: '' });
    }
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Chatbot Training</CardTitle>
          <CardDescription>Manage the Q&A knowledge base for the AI chatbot.</CardDescription>
        </div>
         <div className="flex items-center gap-2">
            <Button onClick={() => openDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Knowledge
            </Button>
            <Button variant="outline" size="icon" onClick={fetchKnowledgeBase} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                <span className="sr-only">Refresh</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Could not load data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead className="text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={3} className="text-center h-40"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : knowledgeBase.length === 0 ? (
                 <TableRow><TableCell colSpan={3} className="text-center h-40">No knowledge entries found. Add one to train the chatbot.</TableCell></TableRow>
            ) : knowledgeBase.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-md whitespace-pre-wrap font-medium">{item.question}</TableCell>
                <TableCell className="max-w-md whitespace-pre-wrap">{item.answer}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(item)}><Edit className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this knowledge entry.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Knowledge' : 'Add New Knowledge'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  rows={3}
                  placeholder='e.g., "What are your opening hours?"'
                  value={currentKnowledge.question || ''}
                  onChange={(e) => setCurrentKnowledge({ ...currentKnowledge, question: e.target.value })}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  rows={5}
                  placeholder='e.g., "We are open from 9 AM to 7 PM every day."'
                  value={currentKnowledge.answer || ''}
                  onChange={(e) => setCurrentKnowledge({ ...currentKnowledge, answer: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
