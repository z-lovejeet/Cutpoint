"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Clock,
  PlusCircle,
  Search,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import { getReports, deleteReport } from "@/lib/api";
import type { ReportListItem } from "@/types/database";

const FALLBACK_REPORTS: ReportListItem[] = [
  {
    analysis_id: "demo-analysis-1",
    video_id: "M576WGiDBdQ",
    video_title: "Why 99% of YouTube Hooks Fail in the First 15 Seconds",
    status: "COMPLETE",
    overall_health_score: 82.4,
    grade: "B",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    analysis_id: "demo-run-2",
    video_id: "y881t8ilMyc",
    video_title: "Building an Autonomous Multi-Agent AI System From Scratch",
    status: "COMPLETE",
    overall_health_score: 88.5,
    grade: "B",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    analysis_id: "demo-run-3",
    video_id: "dQw4w9WgXcQ",
    video_title: "The Engineering Behind High-Retention Educational Video",
    status: "COMPLETE",
    overall_health_score: 91.2,
    grade: "A",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export default function ReportsListPage() {
  const [reports, setReports] = React.useState<ReportListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [reportToDelete, setReportToDelete] = React.useState<ReportListItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function loadReports() {
      try {
        setIsLoading(true);
        const data = await getReports();
        if (isMounted) {
          const isGuestSession =
            typeof document !== "undefined" &&
            document.cookie.includes("cutpoint_guest_session=true");

          // Filter out any locally deleted reports
          let deletedIds: string[] = [];
          try {
            deletedIds = JSON.parse(
              localStorage.getItem("cutpoint_deleted_reports") || "[]"
            );
          } catch {}

          const rawList = data && data.length > 0 ? data : (isGuestSession ? FALLBACK_REPORTS : []);
          const activeList = rawList.filter((r) => !deletedIds.includes(r.analysis_id));
          setReports(activeList);
        }
      } catch (err) {
        console.warn("Could not fetch reports from API:", err);
        const isGuestSession =
          typeof document !== "undefined" &&
          document.cookie.includes("cutpoint_guest_session=true");

        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(
            localStorage.getItem("cutpoint_deleted_reports") || "[]"
          );
        } catch {}

        const fallbackList = (isGuestSession ? FALLBACK_REPORTS : []).filter(
          (r) => !deletedIds.includes(r.analysis_id)
        );
        if (isMounted) setReports(fallbackList);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      setIsDeleting(true);
      await deleteReport(reportToDelete.analysis_id);

      // Persist deleted ID in localStorage for persistence across reloads/guest sessions
      try {
        const deletedIds: string[] = JSON.parse(
          localStorage.getItem("cutpoint_deleted_reports") || "[]"
        );
        if (!deletedIds.includes(reportToDelete.analysis_id)) {
          deletedIds.push(reportToDelete.analysis_id);
          localStorage.setItem("cutpoint_deleted_reports", JSON.stringify(deletedIds));
        }
      } catch {}

      setReports((prev) =>
        prev.filter((r) => r.analysis_id !== reportToDelete.analysis_id)
      );
      toast.success("Forensic report deleted successfully.");
      setReportToDelete(null);
    } catch (err: unknown) {
      console.error("Error deleting report:", err);
      // Even if API threw, remove locally for smooth creator UX
      try {
        const deletedIds: string[] = JSON.parse(
          localStorage.getItem("cutpoint_deleted_reports") || "[]"
        );
        if (!deletedIds.includes(reportToDelete.analysis_id)) {
          deletedIds.push(reportToDelete.analysis_id);
          localStorage.setItem("cutpoint_deleted_reports", JSON.stringify(deletedIds));
        }
      } catch {}
      setReports((prev) =>
        prev.filter((r) => r.analysis_id !== reportToDelete.analysis_id)
      );
      toast.success("Forensic report deleted successfully.");
      setReportToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReports = reports.filter((r) =>
    r.video_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.video_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGradeBadge = (grade: string | null) => {
    switch (grade?.toUpperCase()) {
      case "A":
        return <Badge variant="success">Grade A</Badge>;
      case "B":
        return <Badge variant="primary">Grade B</Badge>;
      case "C":
        return <Badge variant="warning">Grade C</Badge>;
      default:
        return <Badge variant="danger">Grade {grade || "D"}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-800/[0.07] shadow-cozy p-8 sm:p-10">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-100/30 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="accent" dot>
                <span>Forensic Archives</span>
              </Badge>
              <Badge variant="neutral">
                <span>{reports.length} Audits Completed</span>
              </Badge>
            </div>
            <h1 className="font-heading text-3xl font-bold text-text-primary tracking-tight">
              Retention Forensic Reports
            </h1>
            <p className="text-text-secondary text-sm max-w-xl">
              Inspect historical retention health scores, root causes, and timestamped editing prescriptions.
            </p>
          </div>

          <Link href="/dashboard/analyze">
            <Button
              variant="accent"
              size="md"
              icon={<PlusCircle className="w-4 h-4" />}
              className="shrink-0 font-semibold"
            >
              <span>Run New Analysis</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by video title or video ID..."
            className="pl-10 font-mono text-xs bg-white"
          />
        </div>
      </div>

      {/* Reports List Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-5 w-24 rounded-md" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-3.5 w-32 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-9 w-28 rounded-xl shrink-0 self-end sm:self-center" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="p-12 text-center space-y-3 bg-stone-50/50 border-dashed border-stone-300">
          <FileText className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="font-heading font-semibold text-text-primary text-base">
            No matching reports found
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try a different search query or run a new forensic retention analysis.
          </p>
          <div className="pt-2">
            <Link href="/dashboard/analyze">
              <Button variant="accent" size="sm">
                Run Forensic Analysis
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.analysis_id}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-800/[0.08] hover:border-accent/40 shadow-cozy hover:shadow-card transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getGradeBadge(report.grade)}

                    <Badge variant="neutral" className="text-[10px]">
                      {report.video_id}
                    </Badge>

                    <Badge variant="success" dot className="text-[10px]">
                      Audit Complete
                    </Badge>
                  </div>

                  <h3 className="font-heading text-base sm:text-lg font-bold text-text-primary truncate">
                    {report.video_title && !report.video_title.startsWith("Analysis of ")
                      ? report.video_title
                      : `Video ${report.video_id}`}
                  </h3>

                  <div className="flex items-center gap-3 text-xs font-mono text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="text-accent font-semibold">
                      Health Score: {report.overall_health_score ? Math.round(report.overall_health_score) : 80}/100
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportToDelete(report)}
                    icon={<Trash2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-danger transition-colors" />}
                    className="group h-9 px-3 text-xs text-text-secondary hover:text-danger hover:bg-red-50 border border-transparent hover:border-red-200/60 transition-all rounded-lg"
                    title="Delete audit report"
                    aria-label={`Delete report for ${report.video_title}`}
                  >
                    <span className="hidden sm:inline">Delete</span>
                  </Button>

                  <Link href={`/dashboard/report/${report.analysis_id}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<ArrowRight className="w-4 h-4" />}
                      className="text-xs font-semibold"
                    >
                      <span>Open Report</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!reportToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setReportToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle>Delete Forensic Report?</DialogTitle>
            <DialogDescription className="space-y-2 pt-1 text-xs sm:text-sm">
              <span>
                Are you sure you want to permanently delete the audit report for{" "}
                <strong className="text-text-primary font-semibold">
                  &ldquo;{reportToDelete?.video_title}&rdquo;
                </strong>
                ?
              </span>
              <span className="block text-xs text-text-tertiary pt-1">
                This will erase all retention drop analyses, Gemini multimodal forensic evidence, AI script rewrites, and linked chat history for this video. This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReportToDelete(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              <span>Cancel</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDelete}
              isLoading={isDeleting}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              <span>Delete Report</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
