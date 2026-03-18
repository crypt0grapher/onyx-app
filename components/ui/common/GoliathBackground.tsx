type GoliathBackgroundProps = {
    marginTop?: string;
    visibility?: string;
};

const GoliathBackground: React.FC<GoliathBackgroundProps> = ({
    marginTop = "mt-[78px]",
    visibility = "hidden md:block",
}) => {
    return (
        <div
            className={`justify-center items-center opacity-100 pointer-events-none ${visibility} ${marginTop} w-[800px] flex-shrink-0`}
        >
            <div className="relative -z-[1] pointer-events-none flex items-center justify-center">
                <svg
                    width="600"
                    height="600"
                    viewBox="0 0 600 600"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="object-contain"
                >
                    <path
                        d="M300 30C151.08 30 30 151.08 30 300C30 448.92 151.08 570 300 570C366.3 570 426.3 544.68 471.6 503.4C476.7 498.6 480 492 480 484.5V345H315V414H405V462C376.2 482.4 339.6 495 300 495C192.3 495 105 407.7 105 300C105 192.3 192.3 105 300 105C356.1 105 406.5 128.4 442.2 165.9L495.6 112.5C447.6 62.1 378.6 30 300 30Z"
                        fill="white"
                        fillOpacity="0.04"
                    />
                </svg>
                <div className="absolute bottom-0 left-0 pointer-events-none w-[800px] h-[340px] flex-shrink-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.00)_0%,#0F0F0F_100%)]" />
            </div>
        </div>
    );
};

export default GoliathBackground;
