import { Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = {
  name: string;
  path?: string;
};

export function CourierRouteBreadcrumbs({
  items,
  tone = "dark",
}: {
  items: Crumb[];
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <Breadcrumb>
      <BreadcrumbList className={`text-xs sm:text-sm ${light ? "text-white/65" : "text-zinc-500"}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={`${item.name}-${index}`} className="contents">
              {index > 0 ? <BreadcrumbSeparator className={light ? "text-white/40" : undefined} /> : null}
              <BreadcrumbItem>
                {isLast || !item.path ? (
                  <BreadcrumbPage className={light ? "font-medium text-white" : "font-medium text-zinc-700"}>
                    {item.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.path} className={light ? "text-white/75 hover:text-white" : "hover:text-[#FF4907]"}>
                      {item.name}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
