import { SectionHeader } from "@/components/section-header";
import { ServiceCard, type ServiceCardData } from "@/components/service-card";

export function ServicesSection({
  id,
  title,
  services,
  href,
}: {
  id: string;
  title: string;
  services: ServiceCardData[];
  href?: string;
}) {
  return (
    <section aria-labelledby={id}>
      <SectionHeader id={id} title={title} href={href} />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <li key={service.slug}>
            <ServiceCard service={service} />
          </li>
        ))}
      </ul>
    </section>
  );
}
