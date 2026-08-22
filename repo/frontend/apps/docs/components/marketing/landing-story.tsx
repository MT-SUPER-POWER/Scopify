import { LandingScreenshot } from "@/components/marketing/landing-screenshot";
import type { LandingStoryContent } from "@/types/marketing";

export function LandingStory({
  align,
  description,
  eyebrow,
  image,
  imageAlt,
  title,
}: LandingStoryContent) {
  const alignsRight = align === "right";

  return (
    <section className="mx-auto flex min-h-[128svh] w-full max-w-[1480px] flex-col justify-center px-6 py-32 sm:px-10 lg:px-16">
      <div className={alignsRight ? "ml-auto max-w-3xl text-right" : "max-w-3xl"}>
        <p className="mb-6 text-[11px] font-medium tracking-[0.3em] text-white/42 uppercase">
          {eyebrow}
        </p>
        <h2 className="landing-display text-[clamp(3rem,6.2vw,7rem)] leading-[1.03] font-light tracking-[-0.055em] text-balance">
          {title}
        </h2>
        <p
          className={`mt-7 max-w-xl text-base leading-8 text-white/56 sm:text-lg ${alignsRight ? "ml-auto" : ""}`}
        >
          {description}
        </p>
      </div>

      <div className="mt-20 w-full lg:mt-28">
        <LandingScreenshot image={image} alt={imageAlt} />
      </div>
    </section>
  );
}
