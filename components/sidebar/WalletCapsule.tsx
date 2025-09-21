import ConnectWalletButton from "@/components/sidebar/ConnectWalletButton";
import ConnectedWallet from "@/components/sidebar/ConnectedWallet";
import { useWallet } from "@/context/WalletProvider";

const WalletCapsule = () => {
    const { isConnected } = useWallet();

    if (!isConnected) {
        return <ConnectWalletButton />;
    }

    return <ConnectedWallet />;
};

export default WalletCapsule;
