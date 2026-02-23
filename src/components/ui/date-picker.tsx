"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string            // DD-MMM-YYYY string (e.g. "23-Feb-2001")
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** If set, no date after this can be selected (e.g. today for DOB) */
  maxDate?: Date
  /** If set, no date before this can be selected */
  minDate?: Date
  className?: string
}

const DATE_FORMAT = "dd-MMM-yyyy" // e.g. 23-Feb-2001

export function DatePicker({
  value,
  onChange,
  placeholder = "DD-MMM-YYYY",
  disabled,
  maxDate,
  minDate,
  className,
}: DatePickerProps) {
  // Parse incoming string value into a Date object
  const selected = React.useMemo(() => {
    if (!value) return undefined
    // Try DD-MMM-YYYY first
    const parsed = parse(value, DATE_FORMAT, new Date())
    if (isValid(parsed)) return parsed
    // Fallback: try native YYYY-MM-DD
    const iso = new Date(value)
    return isValid(iso) ? iso : undefined
  }, [value])

  const handleSelect = (day: Date | undefined) => {
    if (!day) return
    onChange(format(day, DATE_FORMAT)) // always emit as DD-MMM-YYYY
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, DATE_FORMAT) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          captionLayout="dropdown"
          disabled={(date) => {
            if (maxDate && date > maxDate) return true
            if (minDate && date < minDate) return true
            return false
          }}
          defaultMonth={selected ?? (maxDate ?? undefined)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
