
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, RotateCw, Star } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  testName: string;
}

export function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const db = getDb();
        const reviewsCollection = collection(db, "ashwani", "data", "reviews");
        const q = query(reviewsCollection, orderBy("createdAt", "desc"));
        const reviewsSnapshot = await getDocs(q);
        const reviewsList = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
        setReviews(reviewsList);
    } catch (err: any) {
        console.error("Firestore Error: ", err);
        const errorMessage = `Failed to fetch reviews. Please check Firestore security rules for 'ashwani/data/reviews'. Error: ${err.message}`;
        setError(errorMessage);
        toast({ title: 'Error Fetching Data', description: errorMessage, variant: 'destructive', duration: 10000 });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          )}
        />
      ))}
    </div>
  );

  return (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patient Reviews</CardTitle>
          <CardDescription>View all feedback submitted by patients.</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchReviews} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          <span className="sr-only">Refresh</span>
        </Button>
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
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={4} className="text-center h-40"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : reviews.length === 0 ? (
                 <TableRow><TableCell colSpan={4} className="text-center h-40">No reviews found.</TableCell></TableRow>
            ) : reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="text-sm text-muted-foreground">
                    {review.createdAt ? format(new Date(review.createdAt.seconds * 1000), "dd MMM yyyy") : 'N/A'}
                </TableCell>
                <TableCell>
                    <p className="font-medium">{review.patientName}</p>
                    <p className="text-xs text-muted-foreground">{review.testName}</p>
                </TableCell>
                <TableCell><StarRating rating={review.rating} /></TableCell>
                <TableCell className="max-w-md"><p className="text-sm">{review.comment}</p></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
