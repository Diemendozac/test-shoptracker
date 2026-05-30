import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '50%',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            fill="#1c2140"
            d="M250 25 L322 178 L475 250 L322 322 L250 475 L178 322 L25 250 L178 178Z M312 250 A62 62 0 1 0 188 250 A62 62 0 1 0 312 250Z M276 250 A26 26 0 1 0 224 250 A26 26 0 1 0 276 250Z"
          />
        </svg>
      </div>
    ),
    { ...size },
  )
}
