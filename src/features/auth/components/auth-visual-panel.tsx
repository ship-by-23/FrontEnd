import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { Brand } from "../../../components/brand/brand";

type AuthVisualPanelProps = {
  mode: "login" | "register";
};

const visualCopy = {
  login: {
    eyebrow: "SIMPAN. BACA. LANJUTKAN.",
    title: ["Simpan yang penting.", "Lanjutkan saat waktunya tepat."],
    description: "Bacaanmu tetap tersimpan, lengkap dengan progres dan posisi terakhir yang bisa kamu lanjutkan kembali.",
  },
  register: {
    eyebrow: "MULAI DARI SATU BACAAN.",
    title: ["Simpan sekarang.", "Temukan lagi saat kamu membutuhkannya."],
    description: "Bangun library pribadimu untuk artikel, tutorial, dan dokumentasi yang ingin kamu baca nanti.",
  },
} as const;
const editorialEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Menyusun satu langkah reveal teks dengan fallback langsung untuk reduced motion.
function getRevealMotion(shouldReduceMotion: boolean, delay: number) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 1, y: 0, filter: "blur(0px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 22, filter: "blur(5px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.55, delay, ease: editorialEase },
  };
}

// Menampilkan panel visual auth yang konsisten untuk Login dan Register.
export function AuthVisualPanel({ mode }: AuthVisualPanelProps) {
  const shouldReduceMotion = useReducedMotion() === true;
  const [imageFailed, setImageFailed] = useState(false);
  const copy = visualCopy[mode];
  const titleId = `auth-visual-title-${mode}`;

  // Menyembunyikan foto yang gagal dimuat agar panel tetap memiliki fallback gelap yang usable.
  function handleImageError() {
    setImageFailed(true);
  }

  return (
    <section
      aria-labelledby={titleId}
      className={`relative flex flex-col overflow-hidden bg-[var(--reader-dark)] p-5 text-[var(--surface)] ${mode === "register" ? "min-h-[190px]" : "min-h-[220px]"} md:min-h-0 md:h-full md:p-8 lg:p-12`}
    >
      {!imageFailed ? (
        <img
          src="/images/auth-reading-books.png"
          alt=""
          aria-hidden="true"
          className="auth-visual-image absolute inset-0 size-full object-cover"
          onError={handleImageError}
        />
      ) : null}
      <div className="auth-visual-overlay absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col">
        <Link to="/" aria-label="SimpanDulu — beranda" className="self-start">
          <Brand />
        </Link>

        <div className="mt-auto max-w-xl pb-1 pt-8 md:pb-6 md:pt-16">
          <motion.p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--surface)]/80 md:text-xs" {...getRevealMotion(shouldReduceMotion, 0)}>
            {copy.eyebrow}
          </motion.p>
          <h2 id={titleId} aria-label={copy.title.join(" ")} className="font-editorial mt-3 text-balance text-3xl font-semibold leading-[0.98] md:text-4xl lg:mt-4 lg:text-6xl">
            {copy.title.map((line, index) => (
              <motion.span key={line} className="block" {...getRevealMotion(shouldReduceMotion, 0.1 + index * 0.11)} aria-hidden="true">
                {line}
              </motion.span>
            ))}
          </h2>
          <motion.p className="mt-4 max-w-[34rem] text-xs leading-5 text-[var(--surface)]/80 md:text-sm lg:mt-6 lg:text-base lg:leading-7" {...getRevealMotion(shouldReduceMotion, 0.34)}>
            {copy.description}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
