import Image from 'next/image';
import Link from 'next/link';

type Props = {
  size?: number;
  withText?: boolean;
};

export default function Logo({ size = 28, withText = true }: Props) {
  return (
    <Link href="/" className="flex items-center gap-2">
      {/* ajuste a extensão conforme seu arquivo: .png, .svg, .jpg */}
      <Image
        src="/LogoAcad.png"
        alt="Logo Academia"
        width={size}
        height={size}
        priority
        className="rounded-xl"
      />
      {withText && <span className="font-semibold text-lg">Academia</span>}
    </Link>
  );
}
