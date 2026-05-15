export function SkeletonOne() {
  return (
    <div className="relative flex h-full gap-10 px-2 py-8">
      <div className="mx-auto h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/visuals/features/generate-20-pages.png"
          alt="Generate 20 consistent pages — pipeline summary"
          width={1600}
          height={2000}
          className="h-full w-full rounded-md object-cover object-top"
        />
      </div>
    </div>
  );
}
