"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { handleAdminAction } from "@/app/actions"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const adminControlSchema = z.object({
  action: z.enum(['add', 'edit', 'delete'], { required_error: "Please select an action." }),
  entityType: z.enum(['patient', 'staff', 'phlebo', 'appointment', 'test'], { required_error: "Please select an entity type." }),
  entityDetails: z.string().min(10, {
    message: "Entity details must be at least 10 characters.",
  }),
})

type AdminControlFormValues = z.infer<typeof adminControlSchema>

export function AdminControl() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<AdminControlFormValues>({
    resolver: zodResolver(adminControlSchema),
  })

  async function onSubmit(data: AdminControlFormValues) {
    setIsLoading(true)
    const result = await handleAdminAction(data);
    setIsLoading(false)

    if (result.success) {
      toast({
        title: "Action Successful",
        description: result.message,
      });
      form.reset({ action: undefined, entityType: undefined, entityDetails: ""});
    } else {
      toast({
        title: "Action Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle>System Management</CardTitle>
        <CardDescription>
          Use this AI-powered tool to manage system data. The AI will validate your request against system constraints.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[calc(100%-4.5rem)]">
          <CardContent className="space-y-4 flex-grow">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="add">Add</SelectItem>
                        <SelectItem value="edit">Edit</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Entity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="phlebo">Phlebotomist</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="entityDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Add new patient with name: 'Suresh Kumar', contact: '9988776655'"
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide the details for the action. Be as specific as possible.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Execute Command
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
