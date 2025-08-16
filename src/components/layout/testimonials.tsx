
"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
}

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const db = getDb();
        const reviewsCollection = collection(db, "ashwani", "data", "reviews");
        // Fetch the 5 most recent reviews
        const q = query(reviewsCollection, limit(10)); // Fetch more to filter
        const querySnapshot = await getDocs(q);
        const fetchedReviews = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as Review)
            .filter(review => review.rating && review.comment) // Ensure review has rating and comment
            .slice(0, 5); // Take the top 5 valid reviews

        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "P";
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Patients Say</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Hear from our satisfied patients about their experience with Ashwani Diagnostic Center.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-4xl mt-12">
            {loading ? (
                 <div className="flex justify-center items-center">
                    <Skeleton className="h-48 w-full" />
                 </div>
            ) : reviews.length > 0 ? (
                <Carousel
                    opts={{
                    align: "start",
                    loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent>
                    {reviews.map((review) => (
                        <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-4">
                            <Card className="shadow-lg h-full">
                            <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-4">
                               <Quote className="h-8 w-8 text-primary" />
                                <p className="text-muted-foreground text-sm italic">"{review.comment}"</p>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={cn("h-4 w-4", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                     <Avatar>
                                        <AvatarFallback>{getInitials(review.patientName)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold">{review.patientName}</p>
                                </div>
                            </CardContent>
                            </Card>
                        </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>
             ) : (
                <div className="text-center text-muted-foreground">
                    <p>No reviews yet. Be the first to leave one!</p>
                </div>
            )}
        </div>
      </div>
    </section>
  );
}
