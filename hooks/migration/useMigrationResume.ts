"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMigrationPersistence } from "./useMigrationPersistence";
import type { PendingMigration } from "./types";

export function useMigrationResume() {
    const { address } = useAccount();
    const { loadPendingMigration } = useMigrationPersistence(address);
    const [pendingMigration, setPendingMigration] =
        useState<PendingMigration | null>(null);
    const [isResumed, setIsResumed] = useState(false);

    useEffect(() => {
        const pending = loadPendingMigration();
        if (pending) {
            setPendingMigration(pending);
            setIsResumed(true);
        }
    }, [loadPendingMigration]);

    return { pendingMigration, isResumed };
}
