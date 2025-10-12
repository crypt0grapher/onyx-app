import React, { useMemo } from "react";
import { RawProposal } from "@/lib/governance/format";
import { CONTRACTS } from "@/contracts";
import {
    decodeAbiParameters,
    getAddress,
    parseAbiParameters,
    type Hex,
} from "viem";
import { useTranslations } from "next-intl";
import { buildEtherscanUrl } from "@/utils/explorer";
import Link from "next/link";

interface OperationSectionProps {
    raw: RawProposal;
}

const featureSettings =
    "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]";

function getContractLabel(address: string): string {
    const addrLc = address.toLowerCase();
    for (const [name, cfg] of Object.entries(CONTRACTS)) {
        const cfgAddr = (cfg as { address?: string }).address;
        if (cfgAddr && cfgAddr.toLowerCase() === addrLc) return name;
    }
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return short;
}

function parseSignature(
    signature: string
): { fn: string; types: string[] } | null {
    const m = signature.match(/^(\w+)\((.*)\)$/);
    if (!m) return null;
    const fn = m[1];
    const params = m[2].trim();
    if (params === "") return { fn, types: [] };
    const types = params.split(",").map((s) => s.trim());
    return { fn, types };
}

function formatArg(arg: unknown): string {
    if (typeof arg === "string") {
        try {
            if (arg.startsWith("0x") && arg.length === 42)
                return `"${getAddress(arg)}"`;
        } catch {}
        return `"${arg}"`;
    }
    if (typeof arg === "bigint") return arg.toString();
    if (Array.isArray(arg)) return `[${arg.map(formatArg).join(", ")}]`;
    return String(arg);
}

const OperationSection: React.FC<OperationSectionProps> = ({ raw }) => {
    const t = useTranslations("governance.proposal");

    const operations = useMemo(() => {
        const list: { label: string; line: string }[] = [];
        for (let i = 0; i < raw.signatures.length; i++) {
            const signature = raw.signatures[i] || "";
            const target = raw.targets[i] || "";
            const contractLabel = getContractLabel(target);
            const parsed = parseSignature(signature);
            let argsRepr = "";
            if (parsed) {
                try {
                    if (parsed.types.length === 0) {
                        argsRepr = `${parsed.fn}()`;
                    } else {
                        const abiParams = parseAbiParameters(
                            parsed.types.join(",")
                        );
                        const data = (raw.callDatas[i] || "0x") as Hex;
                        const decoded = decodeAbiParameters(abiParams, data);
                        const formatted = (decoded as unknown as unknown[])
                            .map(formatArg)
                            .join(", ");
                        argsRepr = `${parsed.fn}(${formatted})`;
                    }
                } catch {
                    argsRepr = signature || "unknown()";
                }
            } else {
                argsRepr = signature || "unknown()";
            }
            list.push({ label: contractLabel, line: argsRepr });
        }
        return list;
    }, [raw]);

    if (!operations.length) return null;

    return (
        <>
            <div
                className={`mt-2 text-primary font-sans text-[16px] font-medium leading-6 ${featureSettings}`}
            >
                {t("operation")}
            </div>
            {operations.map((op, idx) => (
                <div
                    key={`${op.label}-${idx}`}
                    className="w-full overflow-wrap-anywhere break-words"
                >
                    <Link
                        target="_blank"
                        href={buildEtherscanUrl(raw.targets[idx], "address")}
                        className={`underline text-primary font-sans text-sm font-normal leading-5 overflow-wrap-anywhere break-words ${featureSettings}`}
                    >
                        {op.label}
                    </Link>
                    <span
                        className={`ml-1 text-secondary font-sans text-sm font-normal leading-5 overflow-wrap-anywhere break-words ${featureSettings}`}
                    >
                        {op.line}
                    </span>
                </div>
            ))}
        </>
    );
};

export default OperationSection;
