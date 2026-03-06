interface ColosseumLogoProps {
    size?: number;
    className?: string;
}

export default function ColosseumLogo({ size = 32, className = '' }: ColosseumLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Ascending arched columns inspired by the Colosseum logo */}
            {/* Column 1 - shortest */}
            <path
                d="M10 90 L10 70 Q10 55 18 55 Q26 55 26 70 L26 90"
                stroke="url(#grad1)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />
            {/* Column 2 */}
            <path
                d="M26 90 L26 58 Q26 40 35 40 Q44 40 44 58 L44 90"
                stroke="url(#grad1)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />
            {/* Column 3 */}
            <path
                d="M42 90 L42 45 Q42 26 52 26 Q62 26 62 45 L62 90"
                stroke="url(#grad1)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />
            {/* Column 4 */}
            <path
                d="M58 90 L58 32 Q58 14 68 14 Q78 14 78 32 L78 90"
                stroke="url(#grad2)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />
            {/* Column 5 - tallest, straight pillar */}
            <path
                d="M82 90 L82 18 Q82 8 87 8 Q92 8 92 18 L92 90"
                stroke="url(#grad2)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />

            <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
        </svg>
    );
}
