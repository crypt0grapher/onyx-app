import { generateUniswapAddLiquidityUrl } from "@/utils/path";
import FARMS from "@/config/farms";

export const useAddLiquidity = () => {
  const addLiquidity = (farmIndex: number = 0) => {
    try {
      const farmConfig = FARMS[farmIndex];
      if (!farmConfig) {
        throw new Error(`Farm configuration not found for index ${farmIndex}`);
      }

      const tokenAAddress = farmConfig.token.address;
      const tokenBAddress =
        farmConfig.quoteToken.symbol === "WETH"
          ? "NATIVE"
          : farmConfig.quoteToken.address;

      const uniswapUrl = generateUniswapAddLiquidityUrl(
        tokenAAddress,
        tokenBAddress
      );

      window.open(uniswapUrl, "_blank", "noopener,noreferrer");

      return { success: true, url: uniswapUrl };
    } catch (error) {
      console.error("Failed to open Uniswap:", error);

      try {
        const farmConfig = FARMS[farmIndex];
        const tokenAAddress = farmConfig.token.address;
        const tokenBAddress =
          farmConfig.quoteToken.symbol === "WETH"
            ? "NATIVE"
            : farmConfig.quoteToken.address;

        const uniswapUrl = generateUniswapAddLiquidityUrl(
          tokenAAddress,
          tokenBAddress
        );

        window.location.href = uniswapUrl;
        return { success: true, url: uniswapUrl, fallback: true };
      } catch (fallbackError) {
        console.error("All fallback methods failed:", fallbackError);
        return {
          success: false,
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error",
        };
      }
    }
  };

  return { addLiquidity };
};
