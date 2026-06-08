// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// import { syncCampaignSchedulesNow } from "@/api/services/campaigns.api";
// import type { SyncedCampaign } from "@/components/dashboard/scheduler/synced-campaigns-list";
// import { extractCampaignsFromSseMessage } from "@/components/dashboard/scheduler/scheduler-utils";

// const SYNC_COMPLETION_WINDOW_MS = 12000;
// const MAX_RECONNECT_ATTEMPTS = 5;
// const BASE_RECONNECT_DELAY_MS = 1000;

// interface UseCampaignSyncOptions {
//   selectedCampaign?: any;
// }

// export function useCampaignSync({ selectedCampaign }: UseCampaignSyncOptions) {
//   const queryClient = useQueryClient();

//   const [isSyncing, setIsSyncing] = useState(false);
//   const [syncedCampaigns, setSyncedCampaigns] = useState<SyncedCampaign[]>([]);
//   const [syncModalOpen, setSyncModalOpen] = useState(false);
//   const [syncProgressItems, setSyncProgressItems] = useState<SyncedCampaign[]>([]);
//   const [syncLastEventAtMs, setSyncLastEventAtMs] = useState<number | null>(null);
//   const [syncCompleted, setSyncCompleted] = useState(false);

//   const reconnectAttemptsRef = useRef(0);
//   const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const esRef = useRef<EventSource | null>(null);
//   const abortControllerRef = useRef<AbortController | null>(null);

//   const handleSyncNow = useCallback(async () => {
//     setSyncModalOpen(true);
//     setSyncCompleted(false);
//     setSyncProgressItems([]);
//     setSyncLastEventAtMs(Date.now());
//     setIsSyncing(true);

//     try {
//       await syncCampaignSchedulesNow();
//     } catch (error) {
//       console.error("SchedulerGrid - sync now failed:", error);
//       toast.error("Unable to start campaign schedule sync.");
//     }
//   }, []);

//   // Fallback: fetch-based polling if EventSource fails completely
//   const fetchSyncStatus = useCallback(async () => {
//     const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
//     if (!apiUrl) return;

//     try {
//       const res = await fetch(`${apiUrl}/campaign-schedules/status`, {
//         credentials: "include",
//       });
//       if (!res.ok) return;
      
//       const data = await res.json();
//       if (data?.campaigns?.length) {
//         setSyncedCampaigns(data.campaigns);
//         setSyncProgressItems(data.campaigns);
//         setSyncLastEventAtMs(Date.now());
//       }
//       if (data?.done) {
//         setSyncCompleted(true);
//         setIsSyncing(false);
//         queryClient.invalidateQueries({ queryKey: ["campaigns"] });
//       }
//     } catch (e) {
//       // Silently fail - polling is best-effort
//     }
//   }, [queryClient]);

//   useEffect(() => {
//     const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
//     if (!apiUrl) {
//       console.error("SchedulerGrid - NEXT_PUBLIC_API_BASE_URL is not set");
//       return;
//     }

//     const eventSourceUrl = `${apiUrl}/campaign-schedules/events`;
//     console.log("SchedulerGrid - attempting SSE connection to:", eventSourceUrl);

//     const connect = () => {
//       if (esRef.current) {
//         esRef.current.close();
//       }

//       const es = new EventSource(eventSourceUrl);
//       esRef.current = es;

//       es.onopen = () => {
//         console.log("SchedulerGrid - EventSource connected successfully");
//         reconnectAttemptsRef.current = 0;
//       };

//       es.onmessage = (event) => {
//         try {
//           const msg = JSON.parse(event.data);
//           let fetchedCampaigns = extractCampaignsFromSseMessage(msg);

//           if (fetchedCampaigns.length === 0 && msg.type === "SCHEDULE_COMPLETED" && msg.campaignId) {
//             const campaignId = String(msg.campaignId);
//             const isSelected = String(selectedCampaign?.id) === campaignId;
//             fetchedCampaigns = [{
//               id: campaignId,
//               name: isSelected ? selectedCampaign.name : `Campaign ${campaignId}`,
//               state: isSelected ? selectedCampaign.status : "unknown",
//               scheduleCount: null,
//             }];
//           }

//           const doneEvent = msg.done === true || msg.data?.done === true;
//           if (doneEvent) {
//             setSyncCompleted(true);
//             setIsSyncing(false);
//             queryClient.invalidateQueries({ queryKey: ["campaigns"] });
//           }

//           if (fetchedCampaigns.length > 0) {
//             setSyncedCampaigns(current => {
//               const byId = new Map(current.map(c => [c.id, c]));
//               fetchedCampaigns.forEach((c: any) => byId.set(c.id, c));
//               return Array.from(byId.values());
//             });
//             setSyncProgressItems(current => {
//               const byId = new Map(current.map(c => [c.id, c]));
//               fetchedCampaigns.forEach((c: any) => byId.set(c.id, c));
//               setSyncLastEventAtMs(Date.now());
//               return Array.from(byId.values());
//             });
//           }
//         } catch (error) {
//           console.error("SchedulerGrid - invalid SSE payload:", error);
//         }
//       };

//       es.onerror = (error) => {
//         // Browser hides error details for security - check readyState
//         const state = es.readyState;
//         const stateName = state === 0 ? "CONNECTING" : state === 1 ? "OPEN" : "CLOSED";
//         console.error(`SchedulerGrid - EventSource error (readyState: ${stateName}=${state}):`, error);

//         if (state === EventSource.CLOSED) {
//           es.close();

//           if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
//             const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current);
//             reconnectAttemptsRef.current += 1;
//             console.log(`SchedulerGrid - reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
            
//             reconnectTimerRef.current = setTimeout(connect, delay);
//           } else {
//             console.error("SchedulerGrid - SSE failed after max retries, falling back to polling");
//             // Start polling fallback
//             const pollInterval = setInterval(fetchSyncStatus, 3000);
//             return () => clearInterval(pollInterval);
//           }
//         }
//       };
//     };

//     connect();

//     return () => {
//       if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
//       if (esRef.current) {
//         esRef.current.close();
//         esRef.current = null;
//       }
//     };
//   }, [queryClient, selectedCampaign, fetchSyncStatus]);

//   useEffect(() => {
//     if (!syncModalOpen || syncCompleted) return;
//     if (syncLastEventAtMs === null) return;

//     const t = window.setTimeout(() => {
//       if (syncCompleted) return;
//       if (Date.now() - syncLastEventAtMs < SYNC_COMPLETION_WINDOW_MS) return;
//       if (syncProgressItems.length === 0) return;

//       setSyncCompleted(true);
//       setIsSyncing(false);
//       queryClient.invalidateQueries({ queryKey: ["campaigns"] });
//     }, SYNC_COMPLETION_WINDOW_MS);

//     return () => window.clearTimeout(t);
//   }, [queryClient, syncCompleted, syncLastEventAtMs, syncModalOpen, syncProgressItems.length]);

//   return {
//     isSyncing,
//     syncedCampaigns,
//     syncModalOpen,
//     setSyncModalOpen,
//     syncProgressItems,
//     syncCompleted,
//     handleSyncNow,
//   };
// }

"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { syncCampaignSchedulesNow } from "@/api/services/campaigns.api";
import type { SyncedCampaign } from "@/components/dashboard/scheduler/synced-campaigns-list";

export function useCampaignSync({ selectedCampaign }: { selectedCampaign?: any }) {
  const queryClient = useQueryClient();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCampaigns, setSyncedCampaigns] = useState<SyncedCampaign[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncProgressItems, setSyncProgressItems] = useState<SyncedCampaign[]>([]);
  const [syncCompleted, setSyncCompleted] = useState(false);

  const handleSyncNow = useCallback(async () => {
    setSyncModalOpen(true);
    setSyncCompleted(false);
    setSyncProgressItems([]);
    setIsSyncing(true);

    try {
      await syncCampaignSchedulesNow();
      toast.success("Campaign sync started successfully.");
    } catch (error) {
      console.error("SchedulerGrid - sync now failed:", error);
      toast.error("Unable to start campaign schedule sync.");
      setIsSyncing(false);
      setSyncCompleted(true);
    }
  }, []);

  // SSE disabled — manual fallback for now
  // TODO: Re-enable when backend SSE endpoint is stable

  return {
    isSyncing,
    syncedCampaigns,
    syncModalOpen,
    setSyncModalOpen,
    syncProgressItems,
    syncCompleted,
    handleSyncNow,
  };
}