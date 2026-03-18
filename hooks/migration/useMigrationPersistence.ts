"use client";

import { useCallback } from "react";
import type { PendingMigration } from "./types";

const STORAGE_PREFIX = "migration:pending:v1:";
const STALENESS_MS = 48 * 60 * 60 * 1000; // 48 hours

export function useMigrationPersistence(address: string | undefined) {
    const key = address
        ? `${STORAGE_PREFIX}${address.toLowerCase()}`
        : null;

    const savePendingMigration = useCallback(
        (migration: PendingMigration) => {
            if (!key || typeof window === "undefined") return;
            localStorage.setItem(key, JSON.stringify(migration));
        },
        [key],
    );

    const loadPendingMigration = useCallback((): PendingMigration | null => {
        if (!key || typeof window === "undefined") return null;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as PendingMigration;
            if (Date.now() - parsed.timestamp > STALENESS_MS) {
                localStorage.removeItem(key);
                return null;
            }
            return parsed;
        } catch {
            localStorage.removeItem(key);
            return null;
        }
    }, [key]);

    const clearPendingMigration = useCallback(() => {
        if (!key || typeof window === "undefined") return;
        localStorage.removeItem(key);
    }, [key]);

    return { savePendingMigration, loadPendingMigration, clearPendingMigration };
}
