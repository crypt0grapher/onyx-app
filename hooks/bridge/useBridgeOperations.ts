"use client";

import { useState, useEffect, useCallback } from "react";
import type { BridgeOperation } from "./types";

const STORAGE_KEY = "bridge:operations:v1";
const CLEANUP_DAYS = 7;

const TERMINAL_STATUSES: ReadonlyArray<BridgeOperation["status"]> = [
    "COMPLETED",
    "FAILED",
    "EXPIRED",
];

/**
 * Manages bridge operations persisted in localStorage.
 *
 * On mount the hook loads existing operations and prunes any terminal
 * operations (completed / failed / expired) older than 7 days.  Every
 * mutation (add, update, remove) is immediately flushed to storage so
 * state survives page reloads.
 */
export function useBridgeOperations() {
    const [operations, setOperations] = useState<BridgeOperation[]>([]);

    // ------------------------------------------------------------------
    // Load from localStorage on mount & clean up stale entries
    // ------------------------------------------------------------------

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw) as BridgeOperation[];
            const cutoff =
                Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000;

            const cleaned = parsed.filter((op) => {
                const isTerminal = TERMINAL_STATUSES.includes(op.status);
                return !isTerminal || op.updatedAt > cutoff;
            });

            setOperations(cleaned);

            if (cleaned.length !== parsed.length) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(cleaned),
                );
            }
        } catch {
            /* ignore corrupt / missing data */
        }
    }, []);

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Persist an operations array to localStorage. */
    const persistToStorage = useCallback((ops: BridgeOperation[]) => {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
        }
    }, []);

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    const addOperation = useCallback(
        (op: BridgeOperation) => {
            setOperations((prev) => {
                const next = [...prev, op];
                persistToStorage(next);
                return next;
            });
        },
        [persistToStorage],
    );

    const updateOperation = useCallback(
        (id: string, updates: Partial<BridgeOperation>) => {
            setOperations((prev) => {
                const next = prev.map((op) =>
                    op.id === id
                        ? { ...op, ...updates, updatedAt: Date.now() }
                        : op,
                );
                persistToStorage(next);
                return next;
            });
        },
        [persistToStorage],
    );

    const removeOperation = useCallback(
        (id: string) => {
            setOperations((prev) => {
                const next = prev.filter((op) => op.id !== id);
                persistToStorage(next);
                return next;
            });
        },
        [persistToStorage],
    );

    const getOperation = useCallback(
        (id: string): BridgeOperation | null =>
            operations.find((op) => op.id === id) ?? null,
        [operations],
    );

    return {
        operations,
        addOperation,
        updateOperation,
        removeOperation,
        getOperation,
    } as const;
}
