import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Highlighter,
  Link2,
  ListFilter,
  LockKeyhole,
  Menu,
  MousePointer2,
  NotebookPen,
  PanelTop,
  Search,
  Tag,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
} from "react";
import type { LucideProps } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../../../components/brand/brand";
import { ThemeSwitch } from "../../../components/ui/theme-switch";
import { cn } from "../../../lib/utils";

const primaryLinkClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] border border-[var(--text)] bg-[var(--text)] px-5 text-sm font-semibold text-[var(--surface)] transition-colors hover:opacity-90";
const secondaryLinkClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] border border-[var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)]";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  headingId: string;
  align?: "left" | "center";
};

// Menampilkan heading section dengan hierarki editorial yang konsisten.
function SectionHeader({
  eyebrow,
  title,
  description,
  headingId,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{eyebrow}</p>
      <h2 id={headingId} className="font-editorial mt-4 text-balance text-5xl font-semibold leading-[0.98] sm:text-6xl lg:text-7xl">
        {title}
      </h2>
      {description ? <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">{description}</p> : null}
    </div>
  );
}

type RevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  amount?: number;
}>;

// Mengungkapkan konten saat masuk viewport dengan fallback reduced-motion.
function Reveal({ children, className, delay = 0, amount = 0.18 }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

type CtaLinkProps = PropsWithChildren<{
  to: string;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
}>;

// Menyatukan gaya link CTA agar seluruh landing menggunakan affordance yang sama.
function CtaLink({ children, to, variant = "primary", className, onClick }: CtaLinkProps) {
  return (
    <Link className={cn(variant === "primary" ? primaryLinkClass : secondaryLinkClass, className)} to={to} onClick={onClick}>
      {children}
    </Link>
  );
}

type IconType = ComponentType<LucideProps>;

type Feature = {
  title: string;
  text: string;
  icon: IconType;
};

const features: Feature[] = [
  {
    title: "Simpan Artikel",
    text: "Tempel URL artikel dan SimpanDulu menyiapkan versi bacaan yang lebih bersih untuk library-mu.",
    icon: Bookmark,
  },
  {
    title: "Lanjutkan Membaca",
    text: "Status Unread, Reading, dan Finished membantu daftar bacaan tetap bergerak, bukan hanya menumpuk.",
    icon: BookOpen,
  },
  {
    title: "Cari Sampai ke Isi",
    text: "Temukan artikel dari kata yang muncul di dalam tulisan, bukan hanya dari judul.",
    icon: Search,
  },
  {
    title: "Tandai yang Penting",
    text: "Buat highlight dan catatan agar ide penting tidak hilang setelah artikel selesai dibaca.",
    icon: Highlighter,
  },
];

const faqItems = [
  {
    question: "Apa bedanya SimpanDulu dengan bookmark browser?",
    answer:
      "SimpanDulu dirancang sebagai daftar bacaan. Artikel dapat memiliki status Unread, Reading, atau Finished, dilanjutkan dari posisi terakhir, dicari dari isi, serta diberi highlight dan catatan.",
  },
  {
    question: "Apakah artikel bisa dibaca langsung di SimpanDulu?",
    answer: "Ya. Artikel yang berhasil diproses dapat dibaca melalui Reader dengan tipografi yang lebih nyaman.",
  },
  {
    question: "Apakah saya bisa mencari isi artikel?",
    answer: "Ya. Pencarian mendukung judul, deskripsi, dan isi artikel yang tersimpan pada akunmu.",
  },
  {
    question: "Apa fungsi status Unread, Reading, dan Finished?",
    answer: "Status tersebut membantu menjadikan library sebagai antrean bacaan yang dapat diselesaikan, bukan sekadar kumpulan link.",
  },
  {
    question: "Apakah SimpanDulu memiliki dark mode?",
    answer: "Seluruh aplikasi mendukung tampilan terang dan gelap, termasuk landing page, login, register, library, dan Reader.",
  },
  {
    question: "Bagaimana cara menyimpan artikel?",
    answer: "Artikel dapat disimpan dari URL. Bookmarklet juga dapat digunakan untuk membawa halaman browser aktif ke proses penyimpanan.",
  },
];

const navLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Reader", href: "#reader" },
  { label: "Pencarian", href: "#pencarian" },
  { label: "FAQ", href: "#faq" },
];

// Mengelola navigasi desktop dan drawer mobile landing page.
export function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Menutup drawer ketika pengguna menekan Escape.
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  // Menutup drawer setelah pengguna memilih anchor navigasi.
  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-muted)] bg-[var(--cream)]">
      <div className="mx-auto flex min-h-[76px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" aria-label="SimpanDulu — beranda" onClick={handleCloseMenu}>
          <Brand compact />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 lg:flex">
          {navLinks.map((item) => (
            <a key={item.href} className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeSwitch />
          <CtaLink to="/login" variant="secondary" className="min-h-10 border-transparent px-4 hover:border-[var(--border-muted)]">
            Masuk
          </CtaLink>
          <CtaLink to="/register" className="min-h-10 px-4">
            Mulai Simpan
          </CtaLink>
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center border border-[var(--border)] lg:hidden"
          aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            id="mobile-navigation"
            className="border-t border-[var(--border-muted)] bg-[var(--surface)] lg:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav aria-label="Navigasi mobile" className="mx-auto grid max-w-[1320px] gap-1 px-5 py-4 sm:px-8">
              {navLinks.map((item) => (
                <a key={item.href} className="border-b border-[var(--border-muted)] py-3 text-sm font-semibold" href={item.href} onClick={handleCloseMenu}>
                  {item.label}
                </a>
              ))}
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <ThemeSwitch />
                <CtaLink to="/login" variant="secondary" onClick={handleCloseMenu}>Masuk</CtaLink>
                <CtaLink to="/register" onClick={handleCloseMenu}>Mulai Simpan</CtaLink>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

// Menampilkan mockup abstrak yang menjelaskan alur URL, library, dan Reader.
function HeroProductVisual() {
  return (
    <div className="relative mx-auto w-full max-w-5xl" aria-label="Ilustrasi alur menyimpan artikel ke Reader" role="img">
      <div className="absolute -left-5 top-16 hidden size-24 border border-[var(--border-muted)] bg-[var(--surface-muted)] sm:block" />
      <div className="absolute -right-4 bottom-10 hidden size-28 rounded-full border border-[var(--border-muted)] bg-[var(--accent)]/35 sm:block" />
      <div className="relative border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_12px_0_rgba(28,28,26,0.06)] sm:p-5">
        <div className="flex items-center gap-2 border-b border-[var(--border-muted)] pb-3">
          <span className="size-2 rounded-full bg-[var(--danger)]" />
          <span className="size-2 rounded-full bg-[var(--warning)]" />
          <span className="size-2 rounded-full bg-[var(--success)]" />
          <div className="ml-2 flex h-7 flex-1 items-center border border-[var(--border-muted)] px-3 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            simpan.dulu / save
          </div>
        </div>
        <div className="grid gap-3 py-3 sm:grid-cols-[1fr_0.8fr_1fr] sm:items-stretch sm:gap-4 sm:py-6">
          <div className="border border-[var(--border-muted)] bg-[var(--cream)] p-4 sm:p-5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <span>Article URL</span>
              <Link2 className="size-3.5" aria-hidden="true" />
            </div>
            <div className="mt-8 grid gap-2">
              <span className="h-2 w-4/5 bg-[var(--text)]/80" />
              <span className="h-2 w-full bg-[var(--border-muted)]" />
              <span className="h-2 w-3/5 bg-[var(--border-muted)]" />
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-[var(--border-muted)] pt-4">
              <span className="text-xs text-[var(--text-muted)]">Simpan untuk nanti</span>
              <Bookmark className="size-4 text-[var(--success)]" aria-hidden="true" />
            </div>
          </div>
          <div className="hidden items-center justify-center sm:flex">
            <div className="flex items-center gap-2 text-[var(--success)]">
              <span className="h-px w-8 bg-[var(--success)]" />
              <ArrowRight className="size-4" aria-hidden="true" />
              <span className="h-px w-8 bg-[var(--success)]" />
            </div>
          </div>
          <div className="border border-[var(--border)] bg-[var(--reader-dark)] p-4 text-[var(--reader-dark-text)] sm:p-5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--reader-dark-text)]/60">
              <span>Reader</span>
              <span className="flex items-center gap-1"><Clock3 className="size-3" aria-hidden="true" /> progress</span>
            </div>
            <div className="mt-8 grid gap-3">
              <span className="h-3 w-4/5 bg-[var(--reader-dark-text)]/90" />
              <span className="h-2 w-full bg-[var(--reader-dark-text)]/25" />
              <span className="h-2 w-11/12 bg-[var(--reader-dark-text)]/25" />
              <span className="h-2 w-3/4 bg-[var(--accent)]/80" />
            </div>
            <div className="mt-8 h-1 bg-[var(--reader-dark-text)]/20"><div className="h-full w-2/5 bg-[var(--accent)]" /></div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border-muted)] pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <span>Save</span><span>Read</span><span>Find again</span>
        </div>
      </div>
    </div>
  );
}

// Menampilkan hero dengan copy utama dan CTA konversi landing.
export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const visualScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const visualOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.68]);

  return (
    <section ref={heroRef} className="relative overflow-hidden border-b border-[var(--border-muted)]" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-[1320px] px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28 lg:px-10 lg:pb-28 lg:pt-32">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)]">Simpan sekarang. Baca nanti.</p>
          <h1 id="hero-heading" className="font-editorial mx-auto mt-6 max-w-4xl text-balance text-[clamp(3.5rem,9vw,8.75rem)] font-semibold leading-[0.83] tracking-[-0.04em]">
            Artikel bagus tidak harus dibaca sekarang.
            <span className="mt-4 block text-[var(--success)]">Simpan dulu.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg sm:leading-8">
            Simpan artikel, tutorial, dan dokumentasi yang ingin kamu baca nanti. SimpanDulu merapikan semuanya dalam satu library, lengkap dengan status baca, pencarian isi, highlight, dan posisi terakhir.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <CtaLink to="/register">Mulai Simpan <ArrowRight className="size-4" aria-hidden="true" /></CtaLink>
            <CtaLink to="/login" variant="secondary">Masuk</CtaLink>
          </div>
        </motion.div>

        <motion.div
          className="mt-16 sm:mt-20 lg:mt-24"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 36 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={shouldReduceMotion ? undefined : { scale: visualScale, opacity: visualOpacity }}
        >
          <HeroProductVisual />
        </motion.div>
      </div>
    </section>
  );
}

// Menjelaskan transformasi dari link yang tersebar menjadi reading library.
export function ProductStorySection() {
  return (
    <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10" aria-labelledby="story-heading">
      <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
        <Reveal>
          <div>
            <SectionHeader
              eyebrow="Why SimpanDulu"
              title="Bukan sekadar tempat menyimpan link."
              description="Tab terbuka, link di chat, dan bookmark browser mudah menumpuk. Masalahnya bukan cuma menyimpan alamat halaman, tetapi mengingat apa yang ingin dibaca dan menemukan kembali bagian yang penting."
              headingId="story-heading"
            />
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="relative min-h-[360px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:min-h-[420px] sm:p-8" aria-label="Ilustrasi link yang ditata menjadi library" role="img">
            <div className="absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] sm:left-8 sm:top-8">from scattered</div>
            <div className="absolute right-5 top-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--success)] sm:right-8 sm:top-8">to readable</div>
            <div className="absolute left-[11%] top-[27%] flex -rotate-6 items-center gap-2 border border-[var(--border-muted)] bg-[var(--cream)] px-3 py-2 text-xs text-[var(--text-muted)]"><Link2 className="size-3.5" aria-hidden="true" /> link</div>
            <div className="absolute left-[30%] top-[48%] flex rotate-6 items-center gap-2 border border-[var(--border-muted)] bg-[var(--cream)] px-3 py-2 text-xs text-[var(--text-muted)]"><Bookmark className="size-3.5" aria-hidden="true" /> save</div>
            <div className="absolute left-[12%] top-[68%] flex rotate-3 items-center gap-2 border border-[var(--border-muted)] bg-[var(--cream)] px-3 py-2 text-xs text-[var(--text-muted)]"><FileText className="size-3.5" aria-hidden="true" /> read</div>
            <div className="absolute left-[47%] top-[46%] text-[var(--success)]"><ArrowRight className="size-8" aria-hidden="true" /></div>
            <div className="absolute right-[9%] top-[25%] w-[38%] border border-[var(--border)] bg-[var(--cream)] p-3 sm:p-4">
              <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3"><span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Library</span><ListFilter className="size-3.5" aria-hidden="true" /></div>
              <div className="mt-4 grid gap-2"><span className="h-2 w-4/5 bg-[var(--text)]/80" /><span className="h-2 w-full bg-[var(--border-muted)]" /><span className="h-2 w-3/5 bg-[var(--border-muted)]" /></div>
            </div>
            <div className="absolute bottom-[17%] right-[15%] flex items-center gap-2 border border-[var(--success)] bg-[var(--accent)]/25 px-3 py-2 text-xs font-semibold"><Check className="size-3.5" aria-hidden="true" /> ready to read</div>
            <div className="absolute bottom-5 left-5 right-5 h-px bg-[var(--border-muted)] sm:bottom-8 sm:left-8 sm:right-8" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Menampilkan empat kemampuan inti yang menjawab masalah reading backlog.
export function FeatureCardsSection() {
  return (
    <section id="fitur" className="scroll-mt-24 border-y border-[var(--border-muted)] bg-[var(--surface-muted)]" aria-labelledby="features-heading">
      <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <Reveal>
          <SectionHeader eyebrow="Core features" title="Semua yang kamu butuhkan untuk benar-benar membaca yang kamu simpan." headingId="features-heading" />
        </Reveal>
        <div className="mt-14 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {features.map(({ title, text, icon: Icon }, index) => (
            <Reveal key={title} delay={index * 0.08} className="h-full">
              <article className="group h-full bg-[var(--surface)] p-6 transition-colors hover:bg-[var(--cream)] sm:p-8">
                <Icon className="size-6 text-[var(--success)]" aria-hidden="true" />
                <h3 className="font-editorial mt-16 text-3xl font-semibold leading-none">{title}</h3>
                <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
                <div className="mt-12 h-px w-10 bg-[var(--border)] transition-all group-hover:w-full" />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

type BentoTileProps = PropsWithChildren<{
  className?: string;
  label: string;
  title: string;
}>;

// Menyediakan bingkai tile bento dengan gaya editorial yang ringan.
function BentoTile({ children, className, label, title }: BentoTileProps) {
  return (
    <article className={cn("border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <h3 className="font-editorial mt-3 text-3xl font-semibold leading-none">{title}</h3>
      <div className="mt-7">{children}</div>
    </article>
  );
}

// Menunjukkan lifecycle bacaan dari Unread sampai Finished.
function ReadingStatusVisual() {
  const statuses = ["Unread", "Reading", "Finished"];
  return (
    <div className="grid gap-2">
      {statuses.map((status, index) => (
        <div key={status} className="flex items-center gap-3">
          <span className={cn("flex size-7 items-center justify-center border text-xs", index === 1 ? "border-[var(--success)] bg-[var(--accent)]/40" : "border-[var(--border-muted)]")}>{String(index + 1).padStart(2, "0")}</span>
          <span className={cn("text-sm", index === 1 ? "font-semibold" : "text-[var(--text-muted)]")}>{status}</span>
          {index < statuses.length - 1 ? <span className="ml-auto h-5 w-px bg-[var(--border-muted)]" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

// Menampilkan bento journey yang merangkum cara SimpanDulu dipakai.
export function ReadingJourneySection() {
  return (
    <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10" aria-labelledby="journey-heading">
      <Reveal>
        <SectionHeader eyebrow="Reading journey" title="Dari “nanti dibaca” hingga benar-benar selesai." headingId="journey-heading" />
      </Reveal>
      <div className="mt-14 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
        <Reveal className="sm:col-span-2 lg:col-span-2" delay={0.05}>
          <BentoTile label="01 / Save" title="Simpan dari URL" className="h-full min-h-[260px]">
            <div className="flex h-28 items-center gap-4">
              <div className="flex-1 border border-[var(--border-muted)] bg-[var(--cream)] p-4"><div className="flex items-center gap-2 text-xs font-semibold"><Link2 className="size-4 text-[var(--success)]" aria-hidden="true" /> URL</div><div className="mt-4 grid gap-2"><span className="h-2 w-full bg-[var(--border-muted)]" /><span className="h-2 w-2/3 bg-[var(--border-muted)]" /></div></div>
              <ArrowRight className="size-5 shrink-0 text-[var(--success)]" aria-hidden="true" />
              <div className="flex size-16 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--accent)]/35"><Bookmark className="size-6" aria-hidden="true" /></div>
            </div>
          </BentoTile>
        </Reveal>
        <Reveal className="lg:col-span-1" delay={0.1}>
          <BentoTile label="02 / Status" title="Tetap bergerak" className="h-full min-h-[260px]"><ReadingStatusVisual /></BentoTile>
        </Reveal>
        <Reveal className="lg:col-span-1" delay={0.15}>
          <BentoTile label="03 / Progress" title="Lanjut dari posisi terakhir" className="h-full min-h-[260px]">
            <div className="border border-[var(--border-muted)] bg-[var(--cream)] p-4"><div className="flex items-center justify-between text-xs text-[var(--text-muted)]"><span>Reading progress</span><Clock3 className="size-4" aria-hidden="true" /></div><div className="mt-8 h-2 bg-[var(--surface-muted)]"><div className="h-full w-3/5 bg-[var(--success)]" /></div><div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">last position</div></div>
          </BentoTile>
        </Reveal>
        <Reveal delay={0.2}>
          <BentoTile label="04 / Reader" title="Baca tanpa distraksi" className="h-full min-h-[230px]"><div className="border border-[var(--border)] bg-[var(--reader-dark)] p-4"><div className="h-2 w-3/5 bg-[var(--reader-dark-text)]/80" /><div className="mt-5 grid gap-2"><span className="h-2 bg-[var(--reader-dark-text)]/25" /><span className="h-2 w-5/6 bg-[var(--reader-dark-text)]/25" /><span className="h-2 w-2/3 bg-[var(--accent)]/70" /></div></div></BentoTile>
        </Reveal>
        <Reveal delay={0.25}>
          <BentoTile label="05 / Search" title="Temukan sampai ke isi" className="h-full min-h-[230px]"><div className="border border-[var(--border-muted)] bg-[var(--cream)] p-3"><div className="flex items-center gap-2 border-b border-[var(--border-muted)] pb-3 text-xs"><Search className="size-4" aria-hidden="true" /><span className="text-[var(--text-muted)]">search within library</span></div><div className="mt-4 grid gap-2"><span className="h-2 w-4/5 bg-[var(--text)]/75" /><span className="h-2 w-full bg-[var(--border-muted)]" /><span className="h-2 w-3/5 bg-[var(--accent)]" /></div></div></BentoTile>
        </Reveal>
        <Reveal delay={0.3}>
          <BentoTile label="06 / Tags" title="Rapi tanpa ribet" className="h-full min-h-[230px]"><div className="flex flex-wrap gap-2"><span className="border border-[var(--border)] px-3 py-2 text-xs">TAG A</span><span className="border border-[var(--border-muted)] px-3 py-2 text-xs">TAG B</span><span className="border border-[var(--border-muted)] px-3 py-2 text-xs">TAG C</span></div></BentoTile>
        </Reveal>
        <Reveal className="sm:col-span-2 lg:col-span-1" delay={0.35}>
          <BentoTile label="07 / Highlight" title="Simpan bagian yang penting" className="h-full min-h-[230px]"><div className="grid gap-3 text-sm leading-6 text-[var(--text-muted)]"><span>Gagasan yang ingin diingat.</span><span className="w-fit bg-[var(--accent)] px-1 text-[var(--text)]">Bagian penting tetap terlihat.</span><span className="ml-auto flex items-center gap-2 border border-[var(--border-muted)] px-3 py-2 text-xs text-[var(--text)]"><NotebookPen className="size-3.5" aria-hidden="true" /> note</span></div></BentoTile>
        </Reveal>
      </div>
    </section>
  );
}

type ReaderContentProps = {
  dark?: boolean;
  highlightVisible?: boolean;
};

// Menggambar isi Reader abstrak tanpa menggunakan artikel atau data pengguna.
function ReaderContent({ dark = false, highlightVisible = true }: ReaderContentProps) {
  return (
    <div className={cn("h-full p-5 sm:p-8", dark ? "bg-[var(--reader-dark)] text-[var(--reader-dark-text)]" : "bg-[var(--cream)] text-[var(--text)]")}>
      <div className={cn("flex items-center justify-between border-b pb-4 text-[10px] font-semibold uppercase tracking-[0.16em]", dark ? "border-[var(--reader-dark-text)]/20 text-[var(--reader-dark-text)]/60" : "border-[var(--border-muted)] text-[var(--text-muted)]")}>
        <span>Reader mode</span><span className="flex items-center gap-1"><Clock3 className="size-3" aria-hidden="true" /> last position</span>
      </div>
      <div className="mx-auto max-w-xl py-8 sm:py-12">
        <div className={cn("h-4 w-3/5", dark ? "bg-[var(--reader-dark-text)]/90" : "bg-[var(--text)]/90")} />
        <div className="mt-7 grid gap-3">
          <span className={cn("h-2 w-full", dark ? "bg-[var(--reader-dark-text)]/25" : "bg-[var(--border-muted)]")} />
          <span className={cn("h-2 w-11/12", dark ? "bg-[var(--reader-dark-text)]/25" : "bg-[var(--border-muted)]")} />
          <span className={cn("h-2 w-4/5", dark ? "bg-[var(--reader-dark-text)]/25" : "bg-[var(--border-muted)]")} />
          <span className={cn("mt-3 h-2 w-10/12 transition-opacity", highlightVisible ? "bg-[var(--accent)]" : "bg-transparent", dark && highlightVisible && "bg-[var(--success)]")} />
          <span className={cn("h-2 w-full", dark ? "bg-[var(--reader-dark-text)]/25" : "bg-[var(--border-muted)]")} />
          <span className={cn("h-2 w-3/4", dark ? "bg-[var(--reader-dark-text)]/25" : "bg-[var(--border-muted)]")} />
        </div>
      </div>
      <div className={cn("mt-auto h-1", dark ? "bg-[var(--reader-dark-text)]/15" : "bg-[var(--border-muted)]")}><div className={cn("h-full w-3/5", dark ? "bg-[var(--accent)]" : "bg-[var(--success)]")} /></div>
    </div>
  );
}

// Memvisualisasikan perubahan Reader mengikuti posisi scroll native.
function ReaderVisual() {
  const shouldReduceMotion = useReducedMotion();
  const readerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: readerRef, offset: ["start end", "end start"] });
  const lightOpacity = useTransform(scrollYProgress, [0.08, 0.5], [1, 0.45]);
  const darkOpacity = useTransform(scrollYProgress, [0.38, 0.74], [0, 1]);
  const highlightOpacity = useTransform(scrollYProgress, [0.22, 0.5], [0, 1]);
  const progressWidth = useTransform(scrollYProgress, [0.05, 0.9], ["22%", "86%"]);

  return (
    <div ref={readerRef} className="relative min-h-[115vh] lg:min-h-[150vh]">
      <div className="sticky top-24" aria-label="Ilustrasi Reader dengan progress dan highlight" role="img">
        <div className="relative aspect-[4/3] overflow-hidden border border-[var(--border)] bg-[var(--cream)] shadow-[0_10px_0_rgba(28,28,26,0.06)] sm:aspect-[5/4]">
          <motion.div className={cn("absolute inset-0", shouldReduceMotion && "hidden")} style={shouldReduceMotion ? undefined : { opacity: lightOpacity }}>
            <ReaderContent dark={false} highlightVisible />
          </motion.div>
          <motion.div className="absolute inset-0" style={shouldReduceMotion ? undefined : { opacity: darkOpacity }}>
            <ReaderContent dark highlightVisible />
          </motion.div>
          {shouldReduceMotion ? <div className="absolute inset-0"><ReaderContent dark highlightVisible /></div> : null}
          <motion.div className="absolute left-5 top-16 h-1 bg-[var(--accent)] sm:left-8" style={{ width: shouldReduceMotion ? "86%" : progressWidth }} />
          <motion.div className="absolute bottom-5 right-5 border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text)] sm:bottom-8 sm:right-8" style={shouldReduceMotion ? undefined : { opacity: highlightOpacity }}>
            highlight
          </motion.div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]"><span>light reader</span><span>dark reader</span></div>
      </div>
    </div>
  );
}

// Menjelaskan pengalaman membaca yang fokus pada isi, progress, dan posisi terakhir.
export function ReaderShowcaseSection() {
  return (
    <section id="reader" className="scroll-mt-24 border-y border-[var(--border-muted)] bg-[var(--surface-muted)]" aria-labelledby="reader-heading">
      <div className="mx-auto grid max-w-[1320px] gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:px-10">
        <div className="lg:pt-20">
          <Reveal>
            <SectionHeader eyebrow="Reader" title="Baca artikelnya. Bukan distraksinya." description="Reader SimpanDulu menampilkan isi artikel dalam layout yang lebih nyaman untuk membaca panjang, dengan pilihan tema dan posisi terakhir yang dapat dilanjutkan kembali." headingId="reader-heading" />
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-10 grid gap-3 border-t border-[var(--border-muted)] pt-5 text-sm text-[var(--text-muted)] sm:grid-cols-2"><div className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" aria-hidden="true" /><span>Progress tetap tersimpan.</span></div><div className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" aria-hidden="true" /><span>Pindah tema saat membaca.</span></div></div>
          </Reveal>
        </div>
        <ReaderVisual />
      </div>
    </section>
  );
}

// Menampilkan demo pencarian visual tanpa request ke API.
function SearchVisual() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_10px_0_rgba(28,28,26,0.06)] sm:p-6" aria-label="Ilustrasi pencarian isi artikel" role="img">
      <div className="flex items-center gap-3 border-b border-[var(--border-muted)] pb-4"><Search className="size-5 text-[var(--success)]" aria-hidden="true" /><div className="flex-1 text-sm text-[var(--text)]">database migration</div><span className="size-2 rounded-full bg-[var(--success)]" /></div>
      <div className="mt-6 grid gap-3">
        {["Title or description match", "Content match", "Highlight match"].map((label, index) => (
          <motion.div key={label} className="border border-[var(--border-muted)] bg-[var(--cream)] p-4" initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }} whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.4, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]"><span>{label}</span><ArrowUpRight className="size-3.5" aria-hidden="true" /></div>
            <div className="mt-4 grid gap-2"><span className="h-2 w-4/5 bg-[var(--text)]/70" /><span className="h-2 w-full bg-[var(--border-muted)]" /><span className={cn("h-2 w-3/5", index === 2 ? "bg-[var(--accent)]" : "bg-[var(--border-muted)]")} /></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Menjelaskan pencarian berdasarkan kata atau konsep yang diingat pengguna.
export function SearchShowcaseSection() {
  return (
    <section id="pencarian" className="scroll-mt-24 mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10" aria-labelledby="search-heading">
      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
        <Reveal>
          <SearchVisual />
        </Reveal>
        <Reveal delay={0.12}>
          <SectionHeader eyebrow="Full-text search" title="Ingat isinya, temukan artikelnya." description="Tidak ingat judulnya? Cari kata atau konsep yang kamu ingat. SimpanDulu mencari ke judul, deskripsi, dan isi artikel yang tersimpan di library-mu." headingId="search-heading" />
        </Reveal>
      </div>
    </section>
  );
}

// Menunjukkan urutan selection, highlight, dan note ketika membaca.
function HighlightVisual() {
  return (
    <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]" aria-label="Ilustrasi highlight dan catatan" role="img">
      <div className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7"><div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]"><span>Reader</span><Highlighter className="size-4" aria-hidden="true" /></div><div className="mt-8 grid gap-3 text-sm leading-7 text-[var(--text-muted)]"><span>Gagasan pertama menjadi lebih jelas.</span><span className="w-fit bg-[var(--accent)] px-1 text-[var(--text)]">Bagian penting diberi highlight.</span><span>Catatan singkat membantu saat ingin kembali.</span></div></div>
      <div className="flex flex-col justify-end border border-[var(--border)] bg-[var(--reader-dark)] p-5 text-[var(--reader-dark-text)] sm:p-7"><NotebookPen className="size-5 text-[var(--accent)]" aria-hidden="true" /><p className="mt-8 text-sm leading-6 text-[var(--reader-dark-text)]/75">Simpan konteks kecil yang ingin kamu ingat.</p><div className="mt-6 h-px bg-[var(--reader-dark-text)]/20" /><span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--reader-dark-text)]/55">note</span></div>
    </div>
  );
}

// Menjelaskan cara menyimpan ide penting, bukan hanya URL artikel.
export function HighlightsSection() {
  return (
    <section className="border-y border-[var(--border-muted)] bg-[var(--surface-muted)]" aria-labelledby="highlights-heading">
      <div className="mx-auto grid max-w-[1320px] items-center gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-10">
        <Reveal>
          <SectionHeader eyebrow="Highlights & notes" title="Jangan cuma menyimpan artikelnya. Simpan bagian yang penting." description="Sorot bagian penting saat membaca dan tambahkan catatan singkat agar ide yang ingin kamu ingat dapat ditemukan kembali." headingId="highlights-heading" />
        </Reveal>
        <Reveal delay={0.12}><HighlightVisual /></Reveal>
      </div>
    </section>
  );
}

// Menjelaskan pengelompokan bacaan dengan tags tanpa membuat koleksi palsu.
export function TagsSection() {
  return (
    <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10" aria-labelledby="tags-heading">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.8fr] lg:gap-24">
        <Reveal>
          <div className="relative min-h-[300px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:min-h-[360px] sm:p-8" aria-label="Ilustrasi tag abstrak" role="img">
            <div className="absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] sm:left-8 sm:top-8">organize softly</div>
            <div className="absolute left-[18%] top-[35%] flex items-center gap-2 border border-[var(--border)] bg-[var(--cream)] px-4 py-3 text-xs font-semibold"><Tag className="size-4 text-[var(--success)]" aria-hidden="true" /> TAG A</div>
            <div className="absolute right-[16%] top-[28%] border border-[var(--border-muted)] px-4 py-3 text-xs">TAG B</div>
            <div className="absolute bottom-[25%] left-[33%] border border-[var(--border-muted)] px-4 py-3 text-xs">TAG C</div>
            <div className="absolute bottom-5 left-5 right-5 h-px bg-[var(--border-muted)] sm:bottom-8 sm:left-8 sm:right-8" />
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <SectionHeader eyebrow="Organization" title="Rapi tanpa ribet." description="Gunakan tag untuk mengelompokkan bacaan berdasarkan topik, mata kuliah, teknologi, atau konteks yang kamu perlukan." headingId="tags-heading" />
        </Reveal>
      </div>
    </section>
  );
}

// Menyampaikan kapabilitas produk tanpa angka atau statistik fiktif.
export function CapabilityStrip() {
  const capabilities = ["Private by default", "Full-text search", "Reading progress", "Highlights", "Dark Reader"];
  return (
    <section className="border-y border-[var(--border)] bg-[var(--text)] text-[var(--surface)]" aria-label="Kapabilitas SimpanDulu">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-5 gap-y-3 px-5 py-7 text-center text-[10px] font-semibold uppercase tracking-[0.18em] sm:px-8 sm:py-8 lg:px-10">
        {capabilities.map((capability, index) => <span key={capability} className="inline-flex items-center gap-5"><span>{capability}</span>{index < capabilities.length - 1 ? <span className="text-[var(--accent)]" aria-hidden="true">•</span> : null}</span>)}
      </div>
    </section>
  );
}

const howItWorksSteps = [
  { number: "01", title: "Tempel URL", text: "Masukkan tautan artikel yang ingin kamu simpan." },
  { number: "02", title: "SimpanDulu menyiapkan artikel", text: "Metadata dan isi bacaan diproses untuk masuk ke library." },
  { number: "03", title: "Baca saat siap", text: "Mulai dari Unread, lanjutkan progres, lalu tandai Finished." },
  { number: "04", title: "Temukan kembali", text: "Gunakan search, tag, highlight, atau catatan saat kamu membutuhkannya." },
];

// Menampilkan timeline empat langkah dari URL sampai artikel ditemukan kembali.
export function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="scroll-mt-24 mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10" aria-labelledby="how-heading">
      <Reveal><SectionHeader eyebrow="How it works" title="Simpan sekarang. Baca nanti. Temukan lagi." headingId="how-heading" /></Reveal>
      <div className="mt-14 grid gap-0 border-y border-[var(--border)] lg:mt-20 lg:grid-cols-4">
        {howItWorksSteps.map((step, index) => (
          <Reveal key={step.number} delay={index * 0.08} className="h-full">
            <article className="relative h-full border-b border-[var(--border-muted)] py-7 lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
              <div className="flex items-center gap-3"><span className={cn("flex size-9 items-center justify-center border text-xs font-semibold", index === 0 ? "border-[var(--success)] bg-[var(--accent)]/45" : "border-[var(--border-muted)]")}>{step.number}</span><span className="h-px flex-1 bg-[var(--border-muted)] lg:hidden" /></div>
              <h3 className="font-editorial mt-7 max-w-[13rem] text-3xl font-semibold leading-none">{step.title}</h3>
              <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--text-muted)]">{step.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// Menampilkan ilustrasi bookmarklet sebagai bagian dari alur penyimpanan browser.
function BookmarkletVisual() {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_10px_0_rgba(28,28,26,0.06)] sm:p-6" aria-label="Ilustrasi bookmarklet SimpanDulu" role="img">
      <div className="flex items-center gap-2 border-b border-[var(--border-muted)] pb-3"><PanelTop className="size-4 text-[var(--success)]" aria-hidden="true" /><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">browser toolbar</span></div>
      <div className="mt-5 border border-[var(--border-muted)] bg-[var(--cream)] p-5"><div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]"><span>article open</span><MousePointer2 className="size-4" aria-hidden="true" /></div><div className="mt-7 grid gap-2"><span className="h-2 w-4/5 bg-[var(--text)]/75" /><span className="h-2 w-full bg-[var(--border-muted)]" /><span className="h-2 w-2/3 bg-[var(--border-muted)]" /></div></div>
      <div className="flex items-center justify-center py-4 text-[var(--success)]"><ArrowRight className="size-5 rotate-90" aria-hidden="true" /></div>
      <div className="flex items-center justify-between border border-[var(--success)] bg-[var(--accent)]/30 p-4 text-sm font-semibold"><span className="flex items-center gap-2"><Bookmark className="size-4" aria-hidden="true" /> SimpanDulu</span><span className="text-xs text-[var(--text-muted)]">save article</span></div>
    </div>
  );
}

// Menjelaskan bookmarklet tanpa mengimplementasikan script browser.
export function BookmarkletSection() {
  return (
    <section className="border-y border-[var(--border-muted)] bg-[var(--surface-muted)]" aria-labelledby="bookmarklet-heading">
      <div className="mx-auto grid max-w-[1320px] items-center gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_0.9fr] lg:gap-24 lg:px-10">
        <Reveal><SectionHeader eyebrow="Keep the flow" title="Simpan tanpa memutus alur browsing." description="Pasang bookmarklet SimpanDulu di browser untuk membawa halaman yang sedang dibuka langsung ke proses penyimpanan." headingId="bookmarklet-heading" /></Reveal>
        <Reveal delay={0.12}><BookmarkletVisual /></Reveal>
      </div>
    </section>
  );
}

// Menyampaikan privacy sebagai kepemilikan library, tanpa klaim keamanan berlebihan.
export function PrivacySection() {
  return (
    <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10" aria-labelledby="privacy-heading">
      <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <Reveal>
          <div className="flex aspect-square max-w-sm items-center justify-center border border-[var(--border)] bg-[var(--surface)]" aria-label="Ilustrasi library pribadi" role="img"><div className="relative flex size-36 items-center justify-center border border-[var(--border)] bg-[var(--cream)] sm:size-48"><BookOpen className="size-16 text-[var(--success)] sm:size-20" aria-hidden="true" /><div className="absolute -bottom-4 -right-4 flex size-14 items-center justify-center border border-[var(--border)] bg-[var(--accent)]"><LockKeyhole className="size-6" aria-hidden="true" /></div></div></div>
        </Reveal>
        <Reveal delay={0.12}><SectionHeader eyebrow="Private by default" title="Library-mu tetap milikmu." description="Artikel, tag, progress, highlight, dan catatan hanya ditampilkan untuk akun pemiliknya." headingId="privacy-heading" /></Reveal>
      </div>
    </section>
  );
}

// Mengelola accordion FAQ dengan keyboard-friendly button semantics.
export function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Membuka atau menutup jawaban FAQ yang dipilih.
  function handleToggle(index: number) {
    setActiveIndex((current) => (current === index ? null : index));
  }

  return (
    <section id="faq" className="scroll-mt-24 border-y border-[var(--border-muted)] bg-[var(--surface-muted)]" aria-labelledby="faq-heading">
      <div className="mx-auto grid max-w-[1320px] gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:px-10">
        <Reveal><SectionHeader eyebrow="FAQ" title="Pertanyaan yang mungkin muncul sebelum mulai." headingId="faq-heading" /></Reveal>
        <Reveal delay={0.12}>
          <div className="border-y border-[var(--border)]">
            {faqItems.map((item, index) => {
              const isOpen = activeIndex === index;
              const answerId = `faq-answer-${index}`;
              return (
                <div key={item.question} className="border-b border-[var(--border-muted)] last:border-b-0">
                  <button type="button" className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-semibold" aria-expanded={isOpen} aria-controls={answerId} onClick={() => handleToggle(index)}>
                    <span>{item.question}</span>
                    <ChevronDown className={cn("size-5 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? <motion.div id={answerId} role="region" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}><p className="max-w-2xl pb-5 pr-8 text-sm leading-6 text-[var(--text-muted)]">{item.answer}</p></motion.div> : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Menampilkan ajakan akhir dengan kontras kuat sebelum footer.
export function FinalCtaSection() {
  return (
    <section className="bg-[var(--text)] text-[var(--surface)]" aria-labelledby="final-cta-heading">
      <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40">
        <Reveal>
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">SimpanDulu</p>
            <h2 id="final-cta-heading" className="font-editorial mt-5 text-balance text-6xl font-semibold leading-[0.9] sm:text-7xl lg:text-8xl">Artikel bagus tidak harus hilang di antara tab.</h2>
            <p className="mt-7 max-w-xl text-base leading-7 text-[var(--surface)]/65 sm:text-lg">Mulai bangun daftar bacaan yang benar-benar bisa kamu selesaikan.</p>
            <div className="mt-9 flex flex-wrap gap-3"><CtaLink to="/register" className="border-[var(--accent)] bg-[var(--accent)] text-[var(--text)] hover:opacity-90">Mulai Simpan <ArrowRight className="size-4" aria-hidden="true" /></CtaLink><Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] border border-[var(--surface)]/35 px-5 text-sm font-semibold text-[var(--surface)] transition-colors hover:border-[var(--surface)]" to="/login">Masuk</Link></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Menutup landing dengan navigasi produk, akun, dan wordmark brand.
export function LandingFooter() {
  return (
    <footer className="overflow-hidden bg-[var(--text)] text-[var(--surface)]" aria-labelledby="footer-heading">
      <div className="mx-auto max-w-[1320px] px-5 pb-8 sm:px-8 lg:px-10">
        <div className="grid gap-12 border-t border-[var(--surface)]/20 py-10 sm:grid-cols-[1fr_auto_auto] sm:gap-20">
          <div><h2 id="footer-heading" className="sr-only">Footer SimpanDulu</h2><Brand compact /><p className="mt-5 max-w-xs text-sm leading-6 text-[var(--surface)]/60">Simpan sekarang.<br />Baca saat waktunya tepat.</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Produk</p><div className="mt-4 grid gap-3 text-sm text-[var(--surface)]/70"><a className="hover:text-[var(--surface)]" href="#fitur">Fitur</a><a className="hover:text-[var(--surface)]" href="#cara-kerja">Cara Kerja</a><a className="hover:text-[var(--surface)]" href="#faq">FAQ</a></div></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Akun</p><div className="mt-4 grid gap-3 text-sm text-[var(--surface)]/70"><Link className="hover:text-[var(--surface)]" to="/login">Masuk</Link><Link className="hover:text-[var(--surface)]" to="/register">Daftar</Link></div></div>
        </div>
        <div className="border-t border-[var(--surface)]/20 pt-8"><p className="font-editorial whitespace-nowrap text-[clamp(4.5rem,16vw,14rem)] font-semibold leading-[0.65] tracking-[-0.06em] text-[var(--surface)]/[0.09]">SimpanDulu</p><div className="mt-10 flex items-center justify-between text-xs text-[var(--surface)]/50"><span>© SimpanDulu</span><span>Read it later.</span></div></div>
      </div>
    </footer>
  );
}
