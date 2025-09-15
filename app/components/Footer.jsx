import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="mt-auto text-white bg-primary">
      <div className="px-4 pt-12 pb-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-center">
            <Image
              src="/logo-white.png"
              alt="Company Logo"
              className="h-auto max-w-full"
              width={150}
              height={150}
            />
          </div>
          {/* Company Details */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Company Details</h3>
            <p className="text-sm text-white">
              NOON Sandwicherie & Koffie
              <br />
              Keizer Leopoldstraat 1
              <br />
              9000 Gent, België
              <br />
              VAT Number: BTW BE 0795406037
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact</h3>
            <p className="text-sm text-white">
              <a
                href="mailto:orders@thesandwichbar.nl"
                className="text-white hover:text-gray-300"
              >
                orders@thesandwichbar.nl
              </a>
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Information</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-white hover:text-gray-300"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-white hover:text-gray-300"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex justify-between pt-4 mt-8 text-sm text-center border-t text-white border-white/30">
          <p>
            &copy; {new Date().getFullYear()} NOON Sandwicherie & Koffie
            All rights reserved.
          </p>
          <p>
            Powered by{" "}
            <Link
              href="https://mikdevelopment.nl"
              target="_blank"
              className="font-bold transition-colors duration-300 text-white hover:text-orange-500"
            >
              Mik Development
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
