"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const targets = ".card-grid > li, .unit-grid > li, .section > h2, .photo-grid > img";

// Fades content in once as it first scrolls into view. Only items below the fold are
// hidden, and only after hydration, so content stays visible without JavaScript.
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const element of document.querySelectorAll(targets)) {
      if (element.getBoundingClientRect().top < innerHeight) continue;
      element.classList.add("reveal");
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
