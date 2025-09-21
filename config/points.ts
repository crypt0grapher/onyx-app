export type PointsDocumentationType = "overview" | "passive" | "active" | "app";

export interface PointsDocumentationLink {
    type: PointsDocumentationType;
    url: string;
    ariaLabel: string;
}

export const pointsDocumentationLinks: Record<PointsDocumentationType, PointsDocumentationLink> = {
    overview: {
        type: "overview",
        url: "https://docs.onyx.org/points/onyx-points",
        ariaLabel: "Learn about Onyx Points system",
    },
    passive: {
        type: "passive",
        url: "https://docs.onyx.org/points/earning-points/passive-points",
        ariaLabel: "Learn about earning passive points",
    },
    active: {
        type: "active",
        url: "https://docs.onyx.org/points/earning-points/active-points",
        ariaLabel: "Learn about earning active points",
    },
    app: {
        type: "app",
        url: "http://docs.onyx.org/points/earning-points/app-points",
        ariaLabel: "Learn about app points",
    },
};

/**
 * Helper function to get documentation URL by type
 */
export const getPointsDocumentationUrl = (type: PointsDocumentationType): string => {
    return pointsDocumentationLinks[type].url;
};

/**
 * Helper function to open documentation in new tab
 */
export const openPointsDocumentation = (type: PointsDocumentationType): void => {
    const url = getPointsDocumentationUrl(type);
    window.open(url, "_blank");
};
