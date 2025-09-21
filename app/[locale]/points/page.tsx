import {
  PointsPageHeader,
  PointsStatsSection,
  LearnSection,
  PointsCardsSection,
  PointsLeaderboardSection,
} from "@/components/points";
import Divider from "@/components/ui/common/Divider";

export default function Points() {
  return (
    <div className="min-h-screen">
      <main className="lg:ml-[304px] h-screen lg:p-6">
        <div className="px-4 lg:px-0">
          <PointsPageHeader />
          <PointsStatsSection />

          <div className="mt-[24px]">
            <LearnSection />
          </div>

          <PointsCardsSection />

          <Divider className="mt-[24px]" />

          <PointsLeaderboardSection />
        </div>
      </main>
    </div>
  );
}
