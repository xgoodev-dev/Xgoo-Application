import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CourierRouteFaq } from "./types";
import faqImage from "@/assets/landing/faq-packing.jpg";

const ORANGE = "#FF4907";

export function CourierRouteFaqs({
  faqs,
  heading,
  imageAlt,
}: {
  faqs: CourierRouteFaq[];
  heading: string;
  imageAlt: string;
}) {
  return (
    <section className="border-y border-zinc-100 bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="overflow-hidden rounded-md shadow-xl">
          <img
            src={faqImage}
            alt={imageAlt}
            className="aspect-[4/5] w-full object-cover object-center sm:aspect-[5/4] lg:aspect-[4/5]"
            loading="lazy"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
            FAQ
          </p>
          <h2 className="mt-3 text-[1.7rem] font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            {heading}
          </h2>
          <Accordion type="single" collapsible defaultValue="item-0" className="mt-8 space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.q}
                value={`item-${index}`}
                className="overflow-hidden rounded-md border-0 bg-white shadow-sm data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="gap-3 px-4 py-4 text-left text-sm font-semibold text-zinc-900 hover:no-underline sm:px-5 sm:text-base data-[state=open]:bg-[#FF4907] data-[state=open]:text-white [&[data-state=open]>svg]:text-white">
                  <span className="min-w-0 flex-1 text-left leading-snug">{faq.q}</span>
                </AccordionTrigger>
                <AccordionContent className="bg-white px-5 pb-4 pt-3 text-sm leading-relaxed text-zinc-500">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
