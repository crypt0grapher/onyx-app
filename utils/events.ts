import stakeIcon from "@/assets/icons/stake.svg";
import withdrawIcon from "@/assets/icons/withdraw.svg";
import claimIcon from "@/assets/icons/claim.svg";
import tradeIcon from "@/assets/icons/trade.svg";
import swapIcon from "@/assets/icons/swap.svg";
import proposeIcon from "@/assets/icons/propose.svg";
import voteIcon from "@/assets/icons/vote.svg";
import { StaticImageData } from "next/image";

/**
 * Event types that can have icons
 */
export type EventType =
    | "Stake"
    | "Withdraw"
    | "Claim"
    | "Trade"
    | "Swap"
    | "Propose"
    | "Vote";

/**
 * Gets the appropriate icon for an event type
 * @param eventType - The type of event
 * @returns The icon for the event type
 */
export const getEventIcon = (eventType: string): StaticImageData => {
    switch (eventType) {
        case "Stake":
            return stakeIcon;
        case "Withdraw":
            return withdrawIcon;
        case "Claim":
            return claimIcon;
        case "Trade":
            return tradeIcon;
        case "Swap":
            return swapIcon;
        case "Propose":
            return proposeIcon;
        case "Vote":
            return voteIcon;
        default:
            return stakeIcon;
    }
};
