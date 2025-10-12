import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import ProposalModal from "@/components/ui/modal/ProposalModal";
import Divider from "@/components/ui/common/Divider";
import InputField from "@/components/ui/common/InputField";
import RichTextField from "@/components/ui/common/RichTextField";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import ProposalActionCard from "./ProposalActionCard";
import ConfirmationCard, {
    ProposalInfoContent,
    ActionsContent,
} from "./ConfirmationCard";
import arrowGo from "@/assets/icons/arrow_go.svg";
import arrowGoBack from "@/assets/icons/arrow_go_back.svg";
import plusWhite from "@/assets/icons/plus_white.svg";
import plus from "@/assets/icons/plus.svg";
import grayCheckmark from "@/assets/icons/gray_checkmark.svg";
import { useCreateProposal } from "@/hooks/governance/useCreateProposal";
import { useProposalThreshold } from "@/hooks/governance/useProposalThreshold";
import { useVotingPower } from "@/hooks/governance/useVotingPower";
import {
    parseFunctionSignature,
    isValidAddress,
    isValidValue,
    isValidSignature,
} from "@/lib/governance/validation";

interface ProposalAction {
    id: string;
    address: string;
    value: string;
    signature: string;
    callData: string[];
}

interface CreateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
    isOpen,
    onClose,
}) => {
    const t = useTranslations("governance.createProposalModal");
    const [currentStep, setCurrentStep] = useState(1);
    const [proposalName, setProposalName] = useState("");
    const [description, setDescription] = useState("");
    const [modalKey, setModalKey] = useState(0);
    const [actions, setActions] = useState<ProposalAction[]>([
        { id: "1", address: "", value: "", signature: "", callData: [] },
    ]);
    const { createProposal } = useCreateProposal();
    const { thresholdWei } = useProposalThreshold();
    const { votesWei } = useVotingPower();
    const canCreate = (() => {
        if (thresholdWei === null || votesWei === null) return false;
        try {
            return votesWei >= thresholdWei;
        } catch {
            return false;
        }
    })();

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setProposalName("");
            setDescription("");
            setActions([
                {
                    id: "1",
                    address: "",
                    value: "",
                    signature: "",
                    callData: [],
                },
            ]);
            setModalKey((prev) => prev + 1);
        }
    }, [isOpen]);

    const handleNextStep = () => {
        if (currentStep === 1) {
            setCurrentStep(2);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        }
    };

    const handleActionChange = (updatedAction: ProposalAction) => {
        setActions((prev) =>
            prev.map((action) =>
                action.id === updatedAction.id ? updatedAction : action
            )
        );
    };

    const handleAddAction = () => {
        if (actions.length >= 30) return;
        const newId = (actions.length + 1).toString();
        setActions((prev) => [
            ...prev,
            { id: newId, address: "", value: "", signature: "", callData: [] },
        ]);
    };

    const handleDeleteAction = (actionId: string) => {
        if (actions.length === 1) return;
        setActions((prev) => prev.filter((action) => action.id !== actionId));
    };

    const validateActions = (): boolean => {
        for (const action of actions) {
            if (!action.address || !action.signature) return false;

            if (!isValidAddress(action.address)) return false;

            if (action.value && !isValidValue(action.value)) return false;

            if (!isValidSignature(action.signature)) return false;

            const fragment = parseFunctionSignature(action.signature);
            if (fragment) {
                const expectedParams = fragment.inputs.length;
                if (action.callData.length !== expectedParams) return false;

                for (let i = 0; i < expectedParams; i++) {
                    if (
                        !action.callData[i] ||
                        action.callData[i].trim() === ""
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    const handleConfirm = () => {
        if (currentStep === 2 && validateActions()) {
            setCurrentStep(3);
        }
    };

    const [submitting, setSubmitting] = useState(false);
    const handleCreateProposal = async () => {
        try {
            setSubmitting(true);
            await createProposal({
                title: proposalName,
                description,
                actions: actions.map((a) => ({
                    address: a.address,
                    value: a.value,
                    signature: a.signature,
                    callData: a.callData,
                })),
            });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const getModalTitle = () => {
        switch (currentStep) {
            case 1:
                return t("titles.proposalInformations");
            case 2:
                return t("titles.proposalActions");
            case 3:
                return t("titles.confirmation");
            default:
                return t("titles.createProposal");
        }
    };

    return (
        <ProposalModal
            isOpen={isOpen}
            onClose={onClose}
            step={currentStep === 3 ? 2 : currentStep}
            totalSteps={2}
            title={getModalTitle()}
            showDecoration={true}
            ariaLabel="Create Proposal Modal"
        >
            {currentStep === 1 ? (
                <>
                    <div className="flex flex-col gap-4">
                        <div className="px-4">
                            <InputField
                                label={t("fields.proposalName")}
                                placeholder={t(
                                    "fields.proposalNamePlaceholder"
                                )}
                                value={proposalName}
                                onChange={setProposalName}
                                required
                            />
                        </div>

                        <div className="px-4">
                            <RichTextField
                                key={modalKey}
                                label={t("fields.description")}
                                placeholder={t("fields.descriptionPlaceholder")}
                                value={description}
                                onChange={setDescription}
                                minHeight={212}
                                maxHeight={300}
                            />
                        </div>
                    </div>

                    <Divider className="my-6" />

                    <div className="relative px-4">
                        <PrimaryButton
                            label={t("buttons.nextStep")}
                            onClick={handleNextStep}
                            icon={arrowGo}
                            iconPosition="right"
                            disabled={proposalName === "" || description === ""}
                        />
                    </div>
                </>
            ) : currentStep === 2 ? (
                <>
                    <div className="flex flex-col gap-4">
                        <div className="px-4 flex flex-col gap-4">
                            {actions.map((action, index) => (
                                <ProposalActionCard
                                    key={action.id}
                                    action={action}
                                    actionNumber={index + 1}
                                    onActionChange={handleActionChange}
                                    onDelete={() =>
                                        handleDeleteAction(action.id)
                                    }
                                    canDelete={actions.length > 1}
                                    isExpandedByDefault={index === 0}
                                />
                            ))}
                        </div>

                        <div className="px-4 w-full">
                            <SecondaryButton
                                label={t("buttons.addOneMoreAction")}
                                icon={plusWhite}
                                onClick={handleAddAction}
                                className="w-full"
                                backgroundColor="#141414"
                                disabled={actions.length >= 30}
                            />
                        </div>
                    </div>

                    <Divider className="my-6" />

                    <div className="flex flex-col md:flex-row gap-4 px-4">
                        <SecondaryButton
                            label={t("buttons.previousStep")}
                            icon={arrowGoBack}
                            onClick={handlePreviousStep}
                            backgroundColor="#141414"
                            className="w-full"
                        />
                        <PrimaryButton
                            label={t("buttons.confirm")}
                            icon={grayCheckmark}
                            onClick={handleConfirm}
                            disabled={!validateActions()}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col gap-4">
                        <div className="px-4 flex flex-col gap-4">
                            <ConfirmationCard
                                title={t(
                                    "confirmationCards.proposalInformations"
                                )}
                                stepBadge={t(
                                    "confirmationCards.stepBadges.step1"
                                )}
                                isExpandedByDefault={true}
                            >
                                <ProposalInfoContent
                                    proposalName={proposalName}
                                    description={description}
                                />
                            </ConfirmationCard>

                            <ConfirmationCard
                                title={t("confirmationCards.actions")}
                                stepBadge={t(
                                    "confirmationCards.stepBadges.step2"
                                )}
                                isExpandedByDefault={false}
                            >
                                <ActionsContent actions={actions} />
                            </ConfirmationCard>
                        </div>
                    </div>

                    <Divider className="my-6" />

                    <div className="flex flex-col md:flex-row gap-4 px-4">
                        <SecondaryButton
                            label={t("buttons.previousStep")}
                            icon={arrowGoBack}
                            onClick={handlePreviousStep}
                            backgroundColor="#141414"
                            className="w-full"
                        />
                        <PrimaryButton
                            label={
                                submitting
                                    ? t("buttons.creating", {
                                          default: "Creating...",
                                      })
                                    : t("buttons.createProposal")
                            }
                            icon={plus}
                            onClick={handleCreateProposal}
                            disabled={submitting || !canCreate}
                        />
                    </div>
                </>
            )}
        </ProposalModal>
    );
};

export default CreateProposalModal;
