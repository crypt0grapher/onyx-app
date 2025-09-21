"use client";

import {
  PassivePointsCard,
  ActivePointsCard,
  ExploreCard,
} from "@/components/points";

const PointsCardsSection = () => {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-[17px]">
      <PassivePointsCard />
      <ActivePointsCard />
      <ExploreCard />
    </div>
  );
};

export default PointsCardsSection;
