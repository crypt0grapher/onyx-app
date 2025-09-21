import VotingPowerCard from "./VotingPowerCard";
import StakedTokensCard from "./StakedTokensCard";
import TotalProposalsCard from "./TotalProposalsCard";

const GovernanceCards = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-[1fr_24%_24%] gap-4 mb-6">
            <VotingPowerCard />

            <StakedTokensCard showMobileTotalProposals={true} />

            <div className="hidden lg:block">
                <TotalProposalsCard />
            </div>
        </div>
    );
};

export default GovernanceCards;
