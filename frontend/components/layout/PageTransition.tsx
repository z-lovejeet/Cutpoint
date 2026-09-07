"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/animations";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
