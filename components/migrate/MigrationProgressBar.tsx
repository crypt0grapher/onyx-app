"use client";

import { Fragment } from "react";
import type { MigrationStep, StepExecution } from "@/hooks/migration/types";

interface MigrationProgressBarProps {
    visibleSteps: MigrationStep[];
    activeStep: MigrationStep | null;
    stepExecutions: Record<MigrationStep, StepExecution>;
}

const STEP_LABELS: Record<MigrationStep, string> = {
    CLAIM_REWARDS: "Claim",
    APPROVE: "Approval",
    UNSTAKE: "Unstake",
    BRIDGE: "Bridge",
};

type StepState = "completed" | "active" | "failed" | "pending";

function getStepState(
    step: MigrationStep,
    activeStep: MigrationStep | null,
    execution: StepExecution,
): StepState {
    if (execution.status === "CONFIRMED") return "completed";
    if (execution.status === "FAILED") return "failed";
    if (step === activeStep) return "active";
    return "pending";
}

const CIRCLE_CLASSES: Record<StepState, string> = {
    completed: "bg-green-500/20 text-green-400",
    active: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    pending: "bg-[#1a1a2e] text-[#4a4a6a]",
};

const LABEL_CLASSES: Record<StepState, string> = {
    completed: "text-green-400",
    active: "text-green-400",
    failed: "text-red-400",
    pending: "text-[#4a4a6a]",
};

type DotSegmentState = "completed" | "active" | "pending";

function getDotSegmentState(currentStepState: StepState): DotSegmentState {
    if (currentStepState === "completed") return "completed";
    if (currentStepState === "active" || currentStepState === "failed") return "active";
    return "pending";
}

export default function MigrationProgressBar({
    visibleSteps,
    activeStep,
    stepExecutions,
}: MigrationProgressBarProps) {
    return (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl px-6 py-5 overflow-x-auto">
            <div className="flex items-center justify-between min-w-0">
                {visibleSteps.map((step, index) => {
                    const execution = stepExecutions[step];
                    const state = getStepState(step, activeStep, execution);
                    const stepNumber = index + 1;
                    const label = STEP_LABELS[step];
                    const segmentState = getDotSegmentState(state);

                    return (
                        <Fragment key={step}>
                            {/* Step circle + label */}
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${CIRCLE_CLASSES[state]}`}
                                    style={
                                        state === "active"
                                            ? { animation: "activeGlow 2s ease-in-out infinite" }
                                            : undefined
                                    }
                                >
                                    {state === "completed" ? (
                                        <span>&#10003;</span>
                                    ) : state === "failed" ? (
                                        <span>&#10005;</span>
                                    ) : (
                                        <span>{stepNumber}</span>
                                    )}
                                </div>
                                <span
                                    className={`text-xs font-medium transition-colors duration-300 ${LABEL_CLASSES[state]}`}
                                >
                                    {label}
                                </span>
                            </div>

                            {/* Animated dots between steps */}
                            {index < visibleSteps.length - 1 && (
                                <div className="flex items-center gap-1.5 flex-1 justify-center mx-2 min-w-0">
                                    {[0, 1, 2, 3].map((dotIndex) => (
                                        <div
                                            key={dotIndex}
                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                segmentState === "pending"
                                                    ? "bg-[#4a4a6a] opacity-30"
                                                    : "bg-green-500"
                                            }`}
                                            style={
                                                segmentState === "active"
                                                    ? {
                                                          animation: "dotPulse 1.2s ease-in-out infinite",
                                                          animationDelay: `${dotIndex * 150}ms`,
                                                      }
                                                    : undefined
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </Fragment>
                    );
                })}
            </div>
        </div>
    );
}
