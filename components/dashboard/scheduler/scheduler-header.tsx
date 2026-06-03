"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfWeek } from "date-fns";

type SchedulerHeaderProps = {
  mode: "WEEK" | "DATE";
  setMode: (mode: "WEEK" | "DATE") => void;
  weekRangeLabel: string;
  activeWeekStart: string;
  defaultDate: string;
  setWeekStart: (date: string) => void;
  activeSelectedDate: string;
  setSelectedDate: (date: string) => void;
  handleSyncNow: () => Promise<void>;
  handleScheduleTest: () => Promise<void>;
  isSyncing: boolean;
};

export function SchedulerHeader({
  mode,
  setMode,
  weekRangeLabel,
  activeWeekStart,
  defaultDate,
  setWeekStart,
  activeSelectedDate,
  setSelectedDate,
  handleSyncNow,
  handleScheduleTest,
  isSyncing,
}: SchedulerHeaderProps) {
  return (
    <div className="flex gap-4">
      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as "WEEK" | "DATE")}
        className="w-full md:w-auto"
      >
        <TabsList className="bg-zinc-100 p-1 dark:bg-zinc-900">
          <TabsTrigger className="cursor-pointer" value="WEEK">
            Week Mode
          </TabsTrigger>
          {/* <TabsTrigger className="cursor-pointer" value="DATE">
            Date Mode
          </TabsTrigger> */}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {mode === "WEEK" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{weekRangeLabel}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                value={activeWeekStart}
                min={defaultDate}
                onChange={(val: string) => {
                  const picked = new Date(`${val}T00:00:00`);
                  const start = startOfWeek(picked, { weekStartsOn: 1 });
                  const year = start.getFullYear();
                  const month = String(start.getMonth() + 1).padStart(2, "0");
                  const day = String(start.getDate()).padStart(2, "0");
                  setWeekStart(`${year}-${month}-${day}`);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
        {/* {mode === "DATE" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{format(new Date(`${activeSelectedDate}T00:00:00`), "PPP")}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                value={activeSelectedDate}
                min={defaultDate}
                onChange={setSelectedDate}
              />
            </PopoverContent>
          </Popover>
        )} */}

        <Button
          variant="outline"
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")}
          />
          {isSyncing ? "Syncing" : "Sync Now"}
        </Button>
        {/* <Button
          variant="outline"
          onClick={handleScheduleTest}
          className="w-full sm:w-auto"
        >
          Schedule +1m
        </Button> */}
      </div>
    </div>
  );
}
