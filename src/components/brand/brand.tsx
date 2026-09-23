import { cn } from "../../lib/utils";

type BrandProps = {
  className?: string;
  compact?: boolean;
  showWordmark?: boolean;
};

/**
 * Lockup merek dengan bidang terang permanen supaya gambar sumber yang memiliki
 * latar krem tetap kontras ketika ditempatkan pada tampilan terang maupun gelap.
 */
export function Brand({ className, compact = false, showWordmark = true }: BrandProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-[5px] border border-[#d8d2c6] bg-[#fbf8f1] px-2 py-1 shadow-[0_1px_0_rgba(28,28,26,0.08)]",
        className,
      )}
    >
      <span className={cn("relative block shrink-0 overflow-hidden rounded-[3px] bg-[#fbf8f1]", compact ? "size-8" : "size-10")}>
        <img
          src="/brand/simpandulu-logo.png"
          alt=""
          className="absolute inset-0 size-full scale-[1.9] object-contain"
        />
      </span>
      {showWordmark ? (
        <span className={cn("relative block shrink-0 overflow-hidden bg-[#fbf8f1]", compact ? "h-7 w-[108px]" : "h-9 w-[142px]")}>
          <img
            src="/brand/simpandulu-wordmark.png"
            alt=""
            className="absolute inset-0 size-full object-contain"
          />
        </span>
      ) : null}
    </span>
  );
}
