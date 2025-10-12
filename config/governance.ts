export interface Proposal {
    id: string;
    proposalId: number;
    title: string;
    description: string;
    status: "Pending" | "Active" | "Canceled" | "Defeated" | "Succeeded" | "Queued" | "Expired" | "Executed";
    userVoteStatus: "You Have Voted" | "You Have Not Voted";
    created: string;
    type: string;
    forVotes?: string | number;
    againstVotes?: string | number;
}

export interface ProposalStatusConfig {
    labelKey: string;
    variant: "success" | "normal" | "danger";
    customBgColor?: string;
    customTextColor?: string;
}

export interface DropdownOption {
    id: string;
    labelKey: string;
    icon: string;
}

export const proposalStatusConfig: Record<string, ProposalStatusConfig> = {
    Pending: {
        labelKey: "governance.proposal.status.pending",
        variant: "normal",
    },
    Active: {
        labelKey: "governance.proposal.status.active",
        variant: "normal",
    },
    Canceled: {
        labelKey: "governance.proposal.status.canceled",
        variant: "danger",
    },
    Defeated: {
        labelKey: "governance.proposal.status.defeated",
        variant: "danger",
    },
    Succeeded: {
        labelKey: "governance.proposal.status.succeeded",
        variant: "success",
    },
    Queued: {
        labelKey: "governance.proposal.status.queued",
        variant: "normal",
        customBgColor: "#F7CB73",
        customTextColor: "#1B1B1B",
    },
    Expired: {
        labelKey: "governance.proposal.status.expired",
        variant: "danger",
    },
    Executed: {
        labelKey: "governance.proposal.status.executed",
        variant: "success",
    },
};

export const userVoteStatusConfig: Record<string, ProposalStatusConfig> = {
    "You Have Voted": {
        labelKey: "governance.proposal.userVoteStatus.youVoted",
        variant: "success",
    },
    "You Have Not Voted": {
        labelKey: "governance.proposal.userVoteStatus.youNotVoted",
        variant: "normal",
    },
};

export const statusFilterOptions: DropdownOption[] = [
    {
        id: "all-statuses",
        labelKey: "governance.proposal.filters.allStatuses",
        icon: "/assets/icons/all_types.svg",
    },
    {
        id: "Executed",
        labelKey: "governance.proposal.status.executed",
        icon: "/assets/icons/all_types.svg",
    },
    {
        id: "Expired",
        labelKey: "governance.proposal.status.expired",
        icon: "/assets/icons/all_types.svg",
    },
];

export const mockProposals: Proposal[] = [
    {
        id: "1",
        proposalId: 60,
        title: "Activate Onyx Points for XCN Stakers on Ethereum & Deploy Onyx Gas-Free Wallet",
        description:
            "Activate Onyx Points System • Enhance Liquidity Management • Deploy Gas-Free Smart Wallet",
        status: "Executed",
        userVoteStatus: "You Have Voted",
        created: "10 Jul 2025 6:09 PM",
        type: "Protocol Enhancement",
        forVotes: "15000000000000000000000000",
        againstVotes: "2000000000000000000000000",
    },
    {
        id: "2",
        proposalId: 59,
        title: "Add and Testify the Goliath White Paper",
        description:
            "Adopt Goliath Framework • Advance Protocol Scalability & Economic Alignment",
        status: "Executed",
        userVoteStatus: "You Have Not Voted",
        created: "02 Jul 2025 4:45 PM",
        type: "Protocol Framework",
        forVotes: "12500000000000000000000000",
        againstVotes: "3500000000000000000000000",
    },
    {
        id: "3",
        proposalId: 58,
        title: "Extend the Onyx Gas Refund Program",
        description:
            "Extend the Onyx Protocol Gas Refund Program to incentivize voting",
        status: "Executed",
        userVoteStatus: "You Have Not Voted",
        created: "23 Jun 2025 11:31 PM",
        type: "Incentive Program",
    },
    {
        id: "4",
        proposalId: 57,
        title: "Provide XCN Liquidity for BNB Chain Phase 1",
        description: "Phase One: Provide liquidity for XCN/USDT",
        status: "Expired",
        userVoteStatus: "You Have Not Voted",
        created: "15 Jun 2025 11:47 PM",
        type: "Liquidity Management",
    },
    {
        id: "5",
        proposalId: 56,
        title: "Implement Multi-Chain Governance Framework",
        description:
            "Deploy governance contracts across Ethereum, BSC, and Polygon networks",
        status: "Active",
        userVoteStatus: "You Have Voted",
        created: "08 Jun 2025 3:22 PM",
        type: "Multi-Chain Expansion",
        forVotes: "8000000000000000000000000",
        againstVotes: "1500000000000000000000000",
    },
    {
        id: "6",
        proposalId: 55,
        title: "Upgrade Treasury Management Protocol",
        description:
            "Implement automated treasury rebalancing and yield optimization strategies",
        status: "Pending",
        userVoteStatus: "You Have Not Voted",
        created: "01 Jun 2025 9:15 AM",
        type: "Treasury Management",
    },
    {
        id: "7",
        proposalId: 54,
        title: "Launch Onyx NFT Marketplace Integration",
        description:
            "Enable NFT collateral support for lending and borrowing operations",
        status: "Executed",
        userVoteStatus: "You Have Voted",
        created: "25 May 2025 7:33 PM",
        type: "NFT Integration",
    },
    {
        id: "8",
        proposalId: 53,
        title: "Establish Risk Management Committee",
        description:
            "Create dedicated committee for protocol risk assessment and mitigation",
        status: "Expired",
        userVoteStatus: "You Have Not Voted",
        created: "18 May 2025 2:47 PM",
        type: "Risk Management",
    },
    {
        id: "9",
        proposalId: 52,
        title: "Deploy Cross-Chain Bridge Protocol",
        description:
            "Enable seamless asset transfers between supported blockchain networks",
        status: "Active",
        userVoteStatus: "You Have Voted",
        created: "12 May 2025 6:18 AM",
        type: "Bridge Protocol",
    },
    {
        id: "10",
        proposalId: 51,
        title: "Introduce Dynamic Interest Rate Model",
        description:
            "Implement market-responsive interest rates based on utilization and demand",
        status: "Executed",
        userVoteStatus: "You Have Not Voted",
        created: "05 May 2025 11:42 PM",
        type: "Interest Rate Model",
    },
    {
        id: "11",
        proposalId: 50,
        title: "Launch Onyx Mobile Application",
        description: "Deploy native mobile apps for iOS and Android platforms",
        status: "Pending",
        userVoteStatus: "You Have Voted",
        created: "28 Apr 2025 4:56 PM",
        type: "Mobile Development",
    },
    {
        id: "12",
        proposalId: 49,
        title: "Implement Flash Loan Protection Mechanism",
        description:
            "Add advanced security measures against flash loan attacks",
        status: "Executed",
        userVoteStatus: "You Have Voted",
        created: "21 Apr 2025 8:29 AM",
        type: "Security Enhancement",
    },
    {
        id: "13",
        proposalId: 48,
        title: "Establish Onyx Grant Program",
        description:
            "Create funding program for ecosystem development and research initiatives",
        status: "Active",
        userVoteStatus: "You Have Not Voted",
        created: "14 Apr 2025 1:13 PM",
        type: "Grant Program",
    },
    {
        id: "14",
        proposalId: 47,
        title: "Deploy Institutional Trading Interface",
        description:
            "Launch professional trading platform for institutional users",
        status: "Expired",
        userVoteStatus: "You Have Voted",
        created: "07 Apr 2025 10:37 PM",
        type: "Institutional Services",
    },
    {
        id: "15",
        proposalId: 46,
        title: "Integrate Chainlink Price Feeds",
        description:
            "Add decentralized oracle support for enhanced price accuracy",
        status: "Executed",
        userVoteStatus: "You Have Not Voted",
        created: "31 Mar 2025 5:21 AM",
        type: "Oracle Integration",
    },
    {
        id: "16",
        proposalId: 45,
        title: "Launch Onyx Academy Educational Platform",
        description:
            "Create comprehensive educational resources for DeFi and protocol usage",
        status: "Pending",
        userVoteStatus: "You Have Voted",
        created: "24 Mar 2025 3:44 PM",
        type: "Educational Initiative",
    },
    {
        id: "17",
        proposalId: 44,
        title: "Implement Automated Market Making",
        description:
            "Deploy AMM functionality for improved liquidity and trading efficiency",
        status: "Active",
        userVoteStatus: "You Have Not Voted",
        created: "17 Mar 2025 12:08 PM",
        type: "AMM Implementation",
    },
    {
        id: "18",
        proposalId: 43,
        title: "Establish Onyx DAO Treasury Diversification",
        description:
            "Diversify treasury holdings across multiple assets and protocols",
        status: "Executed",
        userVoteStatus: "You Have Voted",
        created: "10 Mar 2025 9:52 AM",
        type: "Treasury Diversification",
    },
    {
        id: "19",
        proposalId: 42,
        title: "Deploy Layer 2 Scaling Solution",
        description:
            "Implement Optimistic Rollup technology for reduced transaction costs",
        status: "Expired",
        userVoteStatus: "You Have Not Voted",
        created: "03 Mar 2025 7:16 PM",
        type: "Layer 2 Scaling",
    },
    {
        id: "20",
        proposalId: 41,
        title: "Launch Onyx Governance Token Staking V2",
        description:
            "Upgrade staking mechanism with enhanced rewards and delegation features",
        status: "Active",
        userVoteStatus: "You Have Voted",
        created: "25 Feb 2025 2:39 PM",
        type: "Staking Upgrade",
    },
];

export const PROPOSALS_PER_PAGE = 4;
