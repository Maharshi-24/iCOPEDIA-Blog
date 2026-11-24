import { APP_STORE_URL, PLAY_URL } from "./site";

const base = "inline-flex min-h-[3.5rem] flex-col items-start justify-center rounded-[3px] px-5 py-2 text-left leading-tight";

/** Google Play and App Store buttons. The App Store one shows "Coming soon" until APP_STORE_URL is set. */
export function StoreButtons({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-col gap-3 min-[420px]:flex-row">
      <a
        href={PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} lift bg-[#F2A900] text-[#23282D] shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)] hover:bg-[#FFB914]`}
      >
        <span className="text-[13px] font-medium">Get it on</span>
        <span className="text-[17px] font-bold">Google Play</span>
      </a>
      {APP_STORE_URL ? (
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} lift border-2 ${dark ? "border-white/80 text-white hover:bg-white/10" : "border-[#23282D] text-[#23282D] hover:bg-[#E6E8E4]"}`}
        >
          <span className="text-[13px] font-medium">Download on the</span>
          <span className="text-[17px] font-bold">App Store</span>
        </a>
      ) : (
        <span
          aria-disabled="true"
          className={`${base} cursor-not-allowed border-2 border-dashed ${dark ? "border-white/35 text-white/60" : "border-[#A9AEA8] text-[#6B7278]"}`}
        >
          <span className="text-[13px] font-medium">App Store</span>
          <span className="text-[17px] font-bold">Coming soon</span>
        </span>
      )}
    </div>
  );
}
