export function SkeletonThree() {
  return (
    <div className="group/image relative flex h-full gap-10">
      <div className="mx-auto h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/visuals/features/in-action.png"
          alt="CrayonSparks in action — every cover is real, end-to-end"
          width={1280}
          height={1600}
          className="h-full w-full rounded-md object-cover object-top transition-transform duration-300 group-hover/image:scale-[1.02]"
        />
      </div>
    </div>
  );
}
