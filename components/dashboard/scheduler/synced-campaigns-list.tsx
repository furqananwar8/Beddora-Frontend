"use client";

export type SyncedCampaign = {
  id: string;
  name: string;
  state: string;
  scheduleCount: number | null;
};

type SyncedCampaignsListProps = {
  campaigns: SyncedCampaign[];
};

export function SyncedCampaignsList({ campaigns }: SyncedCampaignsListProps) {
  if (campaigns.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Fetched campaigns
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Latest campaigns received from the sync event.
        </p>
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
          >
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {campaign.name}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                ID: {campaign.id}
              </div>
            </div>
            <div className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
              {campaign.state}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {campaign.scheduleCount === null
                ? "Schedules: unknown"
                : `Schedules: ${campaign.scheduleCount}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
