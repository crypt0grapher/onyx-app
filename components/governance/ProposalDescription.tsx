import React from "react";
import { useTranslations } from "next-intl";
import MarkdownRenderer from "@/components/ui/common/MarkdownRenderer";
import OperationSection from "./OperationSection";
import { RawProposal, extractDescriptionBody } from "@/lib/governance/format";

interface ProposalDescriptionProps {
  description: string;
  raw?: RawProposal | null;
}

const ProposalDescription: React.FC<ProposalDescriptionProps> = ({
  description,
  raw,
}) => {
  const t = useTranslations("governance.proposal");

  const contentToRender = raw
    ? extractDescriptionBody(raw.description)
    : description;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-primary font-sans text-[20px] font-medium leading-7 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
          {t("description")}
        </h2>
        <p className="mt-1 text-secondary font-sans text-sm font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
          {t("descriptionSubtext")}
        </p>
      </div>

      <div className="w-full p-4 flex flex-col items-start gap-2 rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
        <div className="max-w-[650px] w-full overflow-wrap-anywhere break-words">
          <MarkdownRenderer content={contentToRender} />
          {raw && <OperationSection raw={raw} />}
        </div>
      </div>
    </div>
  );
};

export default ProposalDescription;
