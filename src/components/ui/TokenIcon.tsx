interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenIcon({ symbol, size = 20, className = "" }: TokenIconProps) {
  const s = size;
  const half = s / 2;
  const r = s * 0.38;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      role="img"
      aria-label={symbol}
    >
      {symbol === "USDC" && (
        <>
          <circle cx={half} cy={half} r={r} fill="#2775CA" />
          <text
            x={half}
            y={half}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={s * 0.35}
            fontWeight="700"
            fontFamily="system-ui"
          >
            $
          </text>
        </>
      )}
      {symbol === "USDN" && (
        <>
          <circle cx={half} cy={half} r={r} fill="#00C08B" />
          <text
            x={half}
            y={half}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={s * 0.3}
            fontWeight="700"
            fontFamily="system-ui"
          >
            N$
          </text>
        </>
      )}
      {symbol === "NEAR" && (
        <>
          <circle cx={half} cy={half} r={r} fill="#000000" />
          <polygon
            points={`${half},${half - r * 0.55} ${half + r * 0.5},${half + r * 0.45} ${half - r * 0.5},${half + r * 0.45}`}
            fill="white"
          />
        </>
      )}
      {symbol === "ETH" && (
        <>
          <circle cx={half} cy={half} r={r} fill="#627EEA" />
          <polygon
            points={`${half},${half - r * 0.65} ${half + r * 0.45},${half + r * 0.1} ${half},${half - r * 0.15}`}
            fill="white"
            opacity="0.9"
          />
          <polygon
            points={`${half},${half - r * 0.65} ${half - r * 0.45},${half + r * 0.1} ${half},${half - r * 0.15}`}
            fill="white"
            opacity="0.6"
          />
          <polygon
            points={`${half},${half + r * 0.65} ${half + r * 0.45},${half + r * 0.1} ${half},${half + r * 0.2}`}
            fill="white"
            opacity="0.9"
          />
          <polygon
            points={`${half},${half + r * 0.65} ${half - r * 0.45},${half + r * 0.1} ${half},${half + r * 0.2}`}
            fill="white"
            opacity="0.6"
          />
        </>
      )}
      {symbol === "BTC" && (
        <>
          <circle cx={half} cy={half} r={r} fill="#F7931A" />
          <text
            x={half}
            y={half}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={s * 0.38}
            fontWeight="700"
            fontFamily="system-ui"
          >
            ₿
          </text>
        </>
      )}
    </svg>
  );
}
