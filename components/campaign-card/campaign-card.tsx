import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Campaign } from "@/lib/context/dashboard-context";

const AD_PRODUCT_LABEL: Record<string, string> = {
  SPONSORED_PRODUCTS: "SP",
  SPONSORED_BRANDS: "SB",
  SPONSORED_DISPLAY: "SD",
};

const AD_PRODUCT_COLOR: Record<string, string> = {
  SPONSORED_PRODUCTS: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  SPONSORED_BRANDS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SPONSORED_DISPLAY: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

interface CampaignCardProps {
  campaign: Campaign;
  isSelected: boolean;
  isOperating: boolean;
  onClick: () => void;
}

export function CampaignCard({
  campaign,
  isSelected,
  isOperating,
  onClick,
}: CampaignCardProps) {
  const [sku, ...rest] = campaign.name.split(" - ");
  const label = rest.join(" - ").trim();

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl p-3 transition-all cursor-pointer border-2",
        isSelected
          ? "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30"
          : "hover:bg-zinc-50 border-transparent dark:hover:bg-zinc-800",
      )}
    >
      {/* Top row — ad product badge + status */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
            AD_PRODUCT_COLOR[campaign.adProduct] ?? "bg-zinc-100 text-zinc-600",
          )}
        >
          {AD_PRODUCT_LABEL[campaign.adProduct] ?? campaign.adProduct}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide",
            campaign.status === "ENABLED"
              ? "text-emerald-600 dark:text-emerald-400"
              : campaign.status === "PAUSED"
                ? "text-amber-500 dark:text-amber-400"
                : "text-zinc-400",
          )}
        >
          {campaign.status}
        </span>
      </div>

      {/* SKU */}
      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
        {campaign.name}
      </div>

      {/* Targeting label */}
      <div className="flex justify-between">
        {campaign.countryCode && (
            <div className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
            {campaign?.countryCode?.toUpperCase()}
            </div>
        )}

        {/* Marketplaces + created date */}
        <div className="flex items-center gap-2 text-[12px] text-zinc-400 dark:text-zinc-500">
            {!!campaign.marketplaces?.length && (
            <span>{campaign.marketplaces.join(" · ")}</span>
            )}
            {campaign.creationDate && (
            <span>
                {new Date(campaign.creationDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                })}
            </span>
            )}
        </div>
      </div>

      {/* Operating indicator */}
      {isOperating && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Operating
        </div>
      )}

      {isSelected && (
        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
          Selected
        </div>
      )}
    </div>
  );
}