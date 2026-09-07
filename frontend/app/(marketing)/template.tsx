import * as React from "react";
import { PageTransition } from "@/components/layout/PageTransition";

export default function MarketingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
