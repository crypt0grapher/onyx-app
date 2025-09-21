"use client";

import React from "react";
import { motion } from "framer-motion";
import Spinner from "./Spinner";
import OnyxBackground from "./OnyxBackground";

const PageLoader: React.FC = () => {
  return (
    <div className="h-full flex min-h-[80vh] lg:min-h-[94vh] justify-center lg:pt-12 px-4 overflow-hidden">
      <div className="w-full max-w-[530px] flex flex-col items-center justify-between">
        <div className="w-full flex-1 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            <Spinner ariaLabel="Loading application" />
          </motion.div>
        </div>

        <OnyxBackground marginTop="mt-0" />
      </div>
    </div>
  );
};

export default PageLoader;
