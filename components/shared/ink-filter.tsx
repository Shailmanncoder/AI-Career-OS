export function InkFilter() {
  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter
          id="ink-spread"
          x="-45%"
          y="-45%"
          width="190%"
          height="190%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.011"
            numOctaves="5"
            seed="11"
            result="coarse"
          >
            <animate
              attributeName="baseFrequency"
              className="ink-anim"
              begin="indefinite"
              dur="1200ms"
              values="0.020 0.026; 0.010 0.013; 0.005 0.007"
              keyTimes="0; 0.55; 1"
              fill="freeze"
            />
          </feTurbulence>

          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves="3"
            seed="4"
            result="fine"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="coarse"
            scale="160"
            xChannelSelector="R"
            yChannelSelector="G"
            result="tendrils"
          >
            <animate
              attributeName="scale"
              className="ink-anim"
              begin="indefinite"
              dur="1200ms"
              values="190; 120; 44; 0"
              keyTimes="0; 0.4; 0.75; 1"
              fill="freeze"
            />
          </feDisplacementMap>

          <feDisplacementMap
            in="tendrils"
            in2="fine"
            scale="26"
            xChannelSelector="B"
            yChannelSelector="R"
            result="filaments"
          >
            <animate
              attributeName="scale"
              className="ink-anim"
              begin="indefinite"
              dur="1200ms"
              values="34; 18; 0"
              keyTimes="0; 0.6; 1"
              fill="freeze"
            />
          </feDisplacementMap>

          <feGaussianBlur in="filaments" stdDeviation="5" result="bleed">
            <animate
              attributeName="stdDeviation"
              className="ink-anim"
              begin="indefinite"
              dur="1200ms"
              values="7; 3.4; 0"
              keyTimes="0; 0.6; 1"
              fill="freeze"
            />
          </feGaussianBlur>

          <feColorMatrix
            in="bleed"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 26 -10"
            result="inked"
          />
        </filter>
      </defs>
    </svg>
  );
}
