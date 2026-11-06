import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="site-footer mt-auto bg-blush text-noon">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-4 py-12 md:grid-cols-[auto_1fr_1fr_1fr] md:gap-16 md:px-8">
        <Image
          src="/images/logo-noon-catering.svg"
          alt="NOON Sandwicherie & Koffie"
          width={96}
          height={80}
          className="h-20 w-auto"
        />

        <div className="flex flex-col gap-2">
          <h3 className="eyebrow m-0">Noon Sandwicherie</h3>
          <p className="m-0 text-[13px] leading-[1.7]">
            Keizer Leopoldstraat 1
            <br />
            9000 Gent, België
            <br />
            BTW BE 0795406037
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="eyebrow m-0">Contact</h3>
          <a href="mailto:bestel@noonsandwicherie.be" className="text-[13px] hover:underline">
            bestel@noonsandwicherie.be
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="eyebrow m-0">Informatie</h3>
          <Link href="/terms" className="text-[13px] hover:underline">
            Algemene voorwaarden
          </Link>
          <Link href="/privacy" className="text-[13px] hover:underline">
            Privacybeleid
          </Link>
        </div>
      </div>

      <div className="bg-coral text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-1 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] sm:flex-row md:px-8">
          <p className="m-0">&copy; {new Date().getFullYear()} Noon Sandwicherie & Koffie</p>
          <p className="m-0">
            Powered by{" "}
            <Link href="https://mikdevelopment.nl" target="_blank" className="hover:underline">
              Mik Development
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
