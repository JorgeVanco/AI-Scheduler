// import { Dot } from "lucide-react";

// export default function CalendarList({ calendars }: { calendars: any[] }) {
//     return (
//         <div>
//             <h2>Calendars</h2>
//             <ul>
//                 {calendars.map((calendar) => (
//                     <li key={calendar.id}>
//                         <Dot className="" />
//                         {calendar.summary}
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );

// }


"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

const FormSchema = z.object({
    items: z.array(z.string()).refine((value) => value.some((item) => item), {
        message: "You have to select at least one item.",
    }),
})

export default function CalendarList({ calendars }: { calendars: any[] }) {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            items: ["recents", "home"],
        },
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log("Form submitted:", data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="items"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Calendars</FormLabel>
                                <FormDescription>
                                    Select the calendars you want to use.
                                </FormDescription>
                            </div>
                            {calendars.map((calendar) => (
                                <FormField
                                    key={calendar.id}
                                    control={form.control}
                                    name="items"
                                    render={({ field }) => {
                                        return (
                                            <FormItem
                                                key={calendar.id}
                                                className="flex flex-row items-center gap-2"
                                            >
                                                <FormControl>
                                                    <Checkbox
                                                        style={{ '--primary': calendar.backgroundColor, borderColor: calendar.backgroundColor, accentColor: calendar.backgroundColor } as React.CSSProperties}
                                                        className="border-2 cursor-pointer"
                                                        defaultChecked={calendar.selected}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...field.value, calendar.id])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                        (value) => value !== calendar.id
                                                                    )
                                                                )
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-sm font-normal cursor-pointer">
                                                    {calendar.summaryOverride || calendar.summary}
                                                </FormLabel>
                                            </FormItem>
                                        )
                                    }}
                                />
                            ))}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}
