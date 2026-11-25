import Image from "next/image"

type BrandLogoProps = {
  className?: string
}

export default function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Image
      src="/brandspire-logo.png"
      alt="BrandSpire"
      width={1024}
      height={768}
      className={className}
    />
  )
}
