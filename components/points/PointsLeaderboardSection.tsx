"use client";

import { useTranslations } from "next-intl";
import { TopWinners, LeaderboardTable } from "@/components/points";

const PointsLeaderboardSection = () => {
  const t = useTranslations("points");

  return (
    <div className="mt-[24px]">
      <div className="mb-[24px]">
        <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
          {t("leaderboardTitle")}
        </h2>
        <p className="text-secondary text-[14px] leading-[20px] mb-[16px] md:mb-[24px]">
          {t("leaderboardDescription")}
        </p>
      </div>

      <div className="mb-4 md:mb-[24px]">
        <TopWinners />
      </div>

      <div className="mb-[24px] pb-[40px]">
        <LeaderboardTable />
      </div>
    </div>
  );
};

export default PointsLeaderboardSection;
