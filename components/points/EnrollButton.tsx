"use client";

import { useTranslations } from "next-intl";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import enrollicon from "@/assets/points/enroll.svg";
import { useAccount } from "wagmi";
import { useEnrollmentStatus, useEnroll } from "@/hooks/points/useEnrollment";

interface EnrollButtonProps {
    className?: string;
}

const EnrollButton = ({ className = "" }: EnrollButtonProps) => {
    const t = useTranslations("points");
    const { address } = useAccount();
    const { data: enrollment, isLoading: isLoadingEnroll } =
        useEnrollmentStatus();
    const { mutateAsync: enroll, isPending: isEnrolling } = useEnroll();

    if (!address || isLoadingEnroll || enrollment?.enrolled) {
        return null;
    }

    return (
        <SecondaryButton
            label={isEnrolling ? t("enroll.enrolling") : t("enroll.enrollNow")}
            icon={enrollicon}
            onClick={() => enroll()}
            disabled={isEnrolling}
            className={className}
        />
    );
};

export default EnrollButton;
