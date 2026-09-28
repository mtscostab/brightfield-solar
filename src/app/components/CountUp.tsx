/**
 * A number that counts up when it scrolls into view (driven by MotionController).
 * Screen readers get the final value once; the animated copy is hidden from them.
 */
export function CountUp({ value, duration }: { value: string; duration?: number }) {
  return (
    <>
      <span data-count="" data-count-duration={duration} aria-hidden="true">
        {value}
      </span>
      <span className="visually-hidden">{value}</span>
    </>
  );
}
