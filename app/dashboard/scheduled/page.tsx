"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Loader2, Trash2, AlertCircle, Filter, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { useScheduledJobs } from "@/hooks/use-scheduled-jobs";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboard } from "@/lib/context/dashboard-context";

const TARGET_TZ = "America/Los_Angeles";
const MAX_VISIBLE = 10;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value === "") {
      setDebouncedValue(value); // instant clear, no delay
      return;
    }
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function getPageWindow(current: number, total: number, size: number) {
  if (total <= size) return { start: 1, end: total };
  const block = Math.ceil(current / size);
  const start = (block - 1) * size + 1;
  const end = Math.min(block * size, total);
  return { start, end };
}

export default function ScheduledCampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || "";

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const { clearSelectedCampaign } = useDashboard();

  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Sync local input with URL when user navigates back/forward
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Push debounced search to URL (resets page to 1)
  useEffect(() => {
    if (debouncedSearchInput === search) return;

    const params = new URLSearchParams(searchParams);
    const trimmed = debouncedSearchInput.trim();
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/dashboard/scheduled?${params.toString()}`);
  }, [debouncedSearchInput, search, searchParams, router]);

  const {
    data,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
    refetch,
  } = useScheduledJobs({
    page,
    limit,
    status,
    search,
  });

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns/scheduled-jobs`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) throw new Error("Failed to delete jobs");

      const result = await res.json();
      toast.success(result.message);

      clearSelectedCampaign();

      // Remove cached queries for related data
      queryClient.removeQueries({ queryKey: ["campaigns"] });
      queryClient.removeQueries({ queryKey: ["campaign-schedules"] });
      // CRITICAL: also purge the scheduled-jobs cache so the table refreshes
      queryClient.removeQueries({ queryKey: ["scheduled-jobs"] });

      // Refetch active queries
      await queryClient.refetchQueries({ queryKey: ["campaigns"], type: "active" });
      await refetch();
    } catch (err) {
      toast.error("Failed to delete scheduled jobs");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    // Guard against double-clicks / clicks while the previous page is
    // still in flight landing on stale pagination math.
    if (isFetching) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    router.push(`/dashboard/scheduled?${params.toString()}`);
  };

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1");
    router.push(`/dashboard/scheduled?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
  };

  // Only show the full-page blocking spinner on the very first load,
  // when we have no data at all to show yet. On every subsequent
  // fetch (page change, filter change, search), `data` is kept around
  // via placeholderData in the hook, so we dim the existing table
  // instead of unmounting it. This is what was freezing pagination
  // clicks on larger result sets: the buttons themselves were being
  // removed from the DOM mid-fetch.
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load scheduled jobs</p>
      </div>
    );
  }

  const jobs = data?.data || [];
  const meta = data?.meta;
  const isRefetching = isFetching || isPlaceholderData;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Scheduled Campaigns</h1>
          <p className="text-sm text-zinc-500 mt-1">
            All scheduled jobs across campaigns
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by campaign name..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9 py-2 w-64 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100"
              >
                <X className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <select
              value={status || "all"}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteDialog(true)}
            disabled={jobs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Future Scheduled Jobs
          </button>
        </div>
      </div>

      {/* Table with horizontal scroll */}
      <div
        className={`rounded-lg border border-zinc-200 bg-white shadow-sm overflow-x-auto transition-opacity ${
          isRefetching ? "opacity-60" : "opacity-100"
        }`}
      >
        <table className="w-full text-sm whitespace-nowrap min-w-[1100px]">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Campaign ID</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Type</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Action</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Execute Date (PDT)</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Execute Time (PDT)</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Slot</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Created At</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-zinc-500">
                  {search ? "No scheduled jobs match your search" : "No scheduled jobs found"}
                </td>
              </tr>
            ) : (
              jobs.map((job: any) => {
                const executeAtPDT = job.executeAt
                  ? formatInTimeZone(new Date(job.executeAt), TARGET_TZ, "yyyy-MM-dd")
                  : "N/A";
                const executeTimePDT = job.executeAt ? formatInTimeZone(new Date(job.executeAt), TARGET_TZ, "hh:mm a") : "N/A";

                const slot = job.schedule?.timeSlots?.[0];

                return (
                  <tr key={job.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 text-center font-mono text-xs text-zinc-500"> {job.campaignName || `Campaign ${job.campaignId}`}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium border border-zinc-200 capitalize">
                        {job.jobType.replace("_", " ")}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${job.action === "ENABLE" ? "text-green-600" : "text-amber-600"}`}>
                      {job.action}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{executeAtPDT}</td>
                    <td className="px-4 py-3 text-center">{executeTimePDT}</td>
                    <td className="px-4 py-3 text-center text-zinc-500 text-xs">
                      {slot ? `${slot.startTime} - ${slot.endTime}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[job.status] || "bg-gray-100 text-gray-800"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-500 text-xs">
                      {job.createdAt
                        ? formatInTimeZone(new Date(job.createdAt), TARGET_TZ, "MMM dd, yyyy HH:mm")
                        : "N/A"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className={`flex items-center justify-center gap-2 transition-opacity ${isRefetching ? "opacity-60" : "opacity-100"}`}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isFetching}
            className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {(() => {
            const { start, end } = getPageWindow(page, meta.totalPages, MAX_VISIBLE);
            return (
              <>
                {start > 1 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={isFetching}
                      className="w-8 h-8 rounded-lg text-sm font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      1
                    </button>
                    {start > 2 && (
                      <span className="w-8 h-8 flex items-center justify-center text-zinc-400 text-sm">
                        ...
                      </span>
                    )}
                  </>
                )}

                {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    disabled={isFetching}
                    className={`w-8 h-8 rounded-lg text-sm font-medium disabled:cursor-not-allowed ${
                      p === page
                        ? "bg-indigo-600 text-white"
                        : "border border-zinc-200 hover:bg-zinc-50 text-zinc-700 disabled:opacity-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {end < meta.totalPages && (
                  <>
                    {end < meta.totalPages - 1 && (
                      <span className="w-8 h-8 flex items-center justify-center text-zinc-400 text-sm">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => handlePageChange(meta.totalPages)}
                      disabled={isFetching}
                      className="w-8 h-8 rounded-lg text-sm font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {meta.totalPages}
                    </button>
                  </>
                )}
              </>
            );
          })()}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= meta.totalPages || isFetching}
            className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="text-sm text-zinc-500 text-right">
        Showing {jobs.length} of {meta?.total || 0} jobs
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h2 className="text-lg font-semibold">Delete All Future Jobs?</h2>
            </div>
            <p className="text-zinc-600 mb-6">
              This will permanently delete all scheduled jobs with execution time
              greater than now across all campaigns. Past jobs will remain for audit.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}