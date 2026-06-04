interface BentoHeaderProps {
  image: string | null;
  fallback: React.ReactNode;
  gradient: string;
}

export function BentoHeader({ image, fallback, gradient }: BentoHeaderProps) {
  return (
    <div
      className={`flex h-40 rounded-xl items-center justify-center relative overflow-hidden ${gradient}`}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        fallback
      )}
    </div>
  );
}
