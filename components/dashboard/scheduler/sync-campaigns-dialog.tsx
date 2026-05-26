"use client";

import { useEffect } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SyncedCampaign } from "./synced-campaigns-list";

type SyncCampaignsDialogProps = {
  open: boolean;
  isSyncing: boolean;
  completed: boolean;
  items: SyncedCampaign[];
  onOpenChange: (open: boolean) => void;
};

export function SyncCampaignsDialog({
  open,
  isSyncing,
  completed,
  items,
  onOpenChange,
}: SyncCampaignsDialogProps) {
  useEffect(() => {
    if (!open || !completed) return;

    const t = setTimeout(() => {
      onOpenChange(false);
    }, 900);

    return () => clearTimeout(t);
  }, [open, completed, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (isSyncing && !completed && !next) return;
      onOpenChange(next);
    }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sync campaigns</DialogTitle>
          <DialogDescription>
            {completed
              ? "Sync completed. Campaign list is being refreshed."
              : "Syncing campaigns… fetched campaigns will appear below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            {completed ? (
              <CircleCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600" />
            )}
            <span>
              {completed
                ? `Fetched ${items.length} campaign(s).`
                : "Syncing campaigns…"}
            </span>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                Waiting for campaigns…
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {items.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {c.name}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Campaign {c.id} fetched
                      </div>
                    </div>
                    <CircleCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSyncing && !completed}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

