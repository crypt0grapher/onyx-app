import React from "react";
import Divider from "@/components/ui/common/Divider";
import StatusIcon from "@/components/ui/common/StatusIcon";
import MobileTimelineCard from "./MobileTimelineCard";

interface TimelineEvent {
  label: string;
  date: string;
  type: string;
  eventDate: Date;
}

interface TimelineCardProps {
  countdown: string;
  countdownLabel: string;
  timeline: TimelineEvent[];
}

const TimelineCard: React.FC<TimelineCardProps> = ({
  countdown,
  countdownLabel,
  timeline,
}) => {
  return (
    <>
      <div className="hidden 2xl:flex h-[440px] p-4 flex-col items-start gap-4 shrink-0 rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
        <div className="flex flex-row items-center justify-between w-full">
          <span className="text-secondary text-[14px] leading-5 font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
            {countdownLabel}
          </span>
          <span className="text-primary text-[16px] leading-[28px] font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
            {countdown}
          </span>
        </div>

        <Divider className="flex-shrink-0" />

        <div className="flex flex-col mt-1">
          {timeline.map((event, idx) => {
            const now = new Date();
            const isPastEvent = event.eventDate < now;

            let variant: "success" | "danger" | "normal" = "success";
            if (event.type === "canceled" && isPastEvent) {
              variant = "danger";
            } else if (isPastEvent) {
              variant = "success";
            } else {
              variant = "normal";
            }

            return (
              <React.Fragment key={idx}>
                <div className="flex items-start">
                  <StatusIcon
                    variant={variant}
                    size="md"
                    className="shrink-0"
                  />
                  <div className="ml-2 flex flex-col">
                    <span className="text-primary text-[14px] leading-5 font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                      {event.label}
                    </span>
                    <span className="text-secondary text-[14px] leading-5 font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                      {event.date}
                    </span>
                  </div>
                </div>
                {idx < timeline.length - 1 && (
                  <div className="w-px h-4 bg-[#1F1F1F] mt-1 mb-3 ml-4" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="block 2xl:hidden">
        <MobileTimelineCard
          countdown={countdown}
          countdownLabel={countdownLabel}
          timeline={timeline}
        />
      </div>
    </>
  );
};

export default TimelineCard;
