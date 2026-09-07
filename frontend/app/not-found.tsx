import Link from "next/link";
import { Compass, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-background text-text-primary">
      <Card className="max-w-lg w-full p-8 sm:p-12 text-center space-y-6 shadow-cozy border-stone-800/[0.1] bg-white">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200/60 text-accent flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <Badge variant="warning" size="sm">
            404 • Not Found
          </Badge>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Retention Path Uncharted
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            The page or forensic report you are trying to reach does not exist or has been relocated to another timestamp.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/dashboard">
            <Button
              variant="accent"
              size="md"
              icon={<LayoutDashboard className="w-4 h-4" />}
            >
              <span>Go to Studio Dashboard</span>
            </Button>
          </Link>

          <Link href="/">
            <Button
              variant="secondary"
              size="md"
              icon={<Home className="w-4 h-4" />}
            >
              <span>Back to Overview</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
