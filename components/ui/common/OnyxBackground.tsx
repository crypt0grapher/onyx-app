import Image from "next/image";
import onyxLogoBackground from "@/assets/onyx-logo-background.png";

type OnyxBackgroundProps = {
  marginTop?: string;
  visibility?: string;
};

const OnyxBackground: React.FC<OnyxBackgroundProps> = ({
  marginTop = "mt-[78px]",
  visibility = "hidden md:block",
}) => {
  return (
    <div
      className={`justify-center items-center opacity-100 pointer-events-none ${visibility} ${marginTop} w-[800px] flex-shrink-0`}
    >
      <div className="relative -z-[1] pointer-events-none">
        <Image
          src={onyxLogoBackground}
          alt="Onyx Logo Background"
          width={800}
          height={800}
          className="object-contain"
          priority
        />
        <div className="absolute bottom-0 left-0 pointer-events-none w-[800px] h-[340px] flex-shrink-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.00)_0%,#0F0F0F_100%)]" />
      </div>
    </div>
  );
};

export default OnyxBackground;
