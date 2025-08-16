

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { collection, getDocs, doc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { useEffect, useState, useMemo } from 'react';

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { type Test, type Patient, type Appointment } from "@/lib/data"
import { cn } from "@/lib/utils"
import { logHistory, createNotification } from "@/app/actions/log-history"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

const appointmentFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  age: z.number().min(1, "Age is required."),
  sex: z.string().min(1, "Sex is required."),
  mobile: z.string().min(1, "Mobile number is required."),
  address: z.string().min(1, "Address is required."),
  testIds: z.array(z.string()).min(1, "Please select at least one test."),
  date: z.date({
    required_error: "A date for the appointment is required.",
  }),
  time: z.string({ required_error: "A time for the appointment is required." }),
  description: z.string().optional(),
})

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>

type AppointmentFormProps = {
  patientId: string;
  patient: Patient | null;
  onAppointmentBooked: (newAppointment: Appointment) => void;
};

export function AppointmentForm({ patientId, patient, onAppointmentBooked }: AppointmentFormProps) {
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTests, setIsFetchingTests] = useState(true);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: "",
      age: 0,
      sex: "",
      mobile: "",
      address: "",
      testIds: [],
      description: "",
      date: undefined,
      time: "",
    }
  });

  const { watch, setValue, reset } = form;
  const selectedTestIds = watch("testIds", []);

  const totalCost = useMemo(() => {
    return selectedTestIds.reduce((total, testId) => {
      const test = tests.find(t => t.id === testId);
      return total + (test?.cost || 0);
    }, 0);
  }, [selectedTestIds, tests]);

  useEffect(() => {
    if (patient) {
      setValue("name", patient.name || "");
      setValue("age", patient.age || 0);
      setValue("sex", patient.sex || "");
      setValue("mobile", patient.contact || "");
      setValue("address", patient.address || "");
    }
  }, [patient, setValue]);

  useEffect(() => {
    const fetchTests = async () => {
      setIsFetchingTests(true);
      try {
        const db = getDb();
        const testsCollection = collection(db, "ashwani", "data", "tests");
        const testsSnapshot = await getDocs(testsCollection);
        const testsList = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Test[];
        setTests(testsList);
      } catch (error) {
        console.error("Error fetching tests: ", error);
        toast({ title: 'Error', description: 'Could not load tests.', variant: 'destructive' });
      } finally {
        setIsFetchingTests(false);
      }
    };
    fetchTests();
  }, [toast]);


  async function onSubmit(data: AppointmentFormValues) {
    setIsLoading(true);

    try {
        const db = getDb();
        const selectedTests = tests.filter(t => data.testIds.includes(t.id));
        const appointmentDate = new Date(data.date);
        const [hours, minutes] = data.time.split(":").map(Number);
        appointmentDate.setHours(hours, minutes);

        const newAppointmentRef = doc(collection(db, "ashwani", "data", "appointments"));
        const newAppointmentId = newAppointmentRef.id;

        const appointmentData = {
            id: newAppointmentId,
            patientId: patientId,
            patientName: data.name,
            testId: data.testIds.join(", "),
            testName: selectedTests.map(t => t.name).join(", "),
            date: appointmentDate.toISOString(),
            status: 'Pending',
            address: data.address,
            description: data.description,
            totalCost: totalCost,
            createdAt: serverTimestamp(),
        };

        await setDoc(newAppointmentRef, appointmentData);
        
        await logHistory({
            user: `${data.name} (Patient)`,
            action: `Booked new appointment #${newAppointmentId.substring(0, 5)}... for ${selectedTests.map(t => t.name).join(", ")}.`
        });
        
        await createNotification({
            title: "New Appointment",
            message: `${data.name} booked a new appointment for ${selectedTests[0].name}.`,
            target: "allStaff",
            link: `/staff/dashboard`,
        });

        toast({
            title: "Appointment Booked!",
            description: `Your appointment for ${selectedTests.map(t=>t.name).join(", ")} on ${format(appointmentDate, "PPP p")} has been successfully booked.`,
        });

        reset({
            name: data.name, // Keep patient details pre-filled
            age: data.age,
            sex: data.sex,
            mobile: data.mobile,
            address: data.address,
            testIds: [], // Reset test specific fields
            date: undefined,
            time: "",
            description: ""
        });
        onAppointmentBooked({ ...appointmentData, createdAt: { seconds: Date.now()/1000, nanoseconds: 0 } } as Appointment);

    } catch (error) {
        console.error("Appointment booking error: ", error);
        toast({ title: "Error", description: "Failed to book appointment.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
}


  return (
    <div className="flex flex-col h-full">
       <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
        <DialogTitle>Book an Appointment</DialogTitle>
        <DialogDescription>Fill in your details to book a home collection appointment.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow overflow-hidden">
          <ScrollArea className="flex-grow">
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} placeholder="Your full name" /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="mobile" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl><Input {...field} placeholder="Your mobile number" /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="age" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} placeholder="Your age" /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="sex" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Sex</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )} />
              </div>

              <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Enter your full address for sample collection" /></FormControl>
                      <FormMessage />
                  </FormItem>
              )} />

              <FormField
                control={form.control}
                name="testIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Test(s)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value?.length && "text-muted-foreground"
                            )}
                          >
                            <span className="truncate">
                            {selectedTestIds.length === 0
                                ? "Select tests..."
                                : selectedTestIds.length === 1
                                ? tests.find(t => t.id === selectedTestIds[0])?.name
                                : `${selectedTestIds.length} tests selected`}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search tests..." />
                           <ScrollArea className="h-72">
                            <CommandEmpty>No tests found.</CommandEmpty>
                            <CommandGroup>
                                {tests.map((test) => (
                                    <CommandItem
                                    key={test.id}
                                    value={test.name}
                                    onSelect={() => {
                                        const currentIds = field.value || [];
                                        const newIds = currentIds.includes(test.id)
                                        ? currentIds.filter((id) => id !== test.id)
                                        : [...currentIds, test.id];
                                        field.onChange(newIds);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.includes(test.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="flex-1">{test.name}</span>
                                    <span className="text-muted-foreground">₹{test.cost}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                          </ScrollArea>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                    {selectedTestIds.length > 0 && (
                      <div className="text-right text-sm font-medium text-foreground pt-1">
                        Total MRP: ₹{totalCost}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                      <FormItem className="flex flex-col">
                      <FormLabel>Appointment Date</FormLabel>
                      <Popover>
                          <PopoverTrigger asChild>
                          <FormControl>
                              <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                              )}
                              >
                              {field.value ? (
                                  format(field.value, "PPP")
                              ) : (
                                  <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                          </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                              date < new Date(new Date().setHours(0,0,0,0))
                              }
                              initialFocus
                          />
                          </PopoverContent>
                      </Popover>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Appointment Time</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a time slot" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="08:00">8:00 AM - 9:00 AM</SelectItem>
                                  <SelectItem value="09:00">9:00 AM - 10:00 AM</SelectItem>
                                  <SelectItem value="10:00">10:00 AM - 11:00 AM</SelectItem>
                                  <SelectItem value="11:00">11:00 AM - 12:00 PM</SelectItem>
                                  <SelectItem value="14:00">2:00 PM - 3:00 PM</SelectItem>
                                  <SelectItem value="15:00">3:00 PM - 4:00 PM</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific instructions or notes for the phlebotomist..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ScrollArea>
          <div className="p-6 pt-4 flex-shrink-0 border-t">
            <Button type="submit" disabled={isLoading || isFetchingTests} className="w-full bg-accent hover:bg-accent/90">
              {(isLoading || isFetchingTests) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Appointment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
