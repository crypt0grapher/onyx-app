"use client";

import { useTranslations } from "next-intl";

const PointsPageHeader = () => {
  const t = useTranslations("points");

  return (
    <div className="mb-[16px] md:mb-[24px]">
      <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
        {t("title")}
      </h2>
      <p className="text-secondary text-[14px] leading-[20px]">
        {t("description")}
      </p>
    </div>
  );
};

export default PointsPageHeader;
