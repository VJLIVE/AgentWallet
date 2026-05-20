// Extend React's JSX intrinsic elements to include the <marquee> HTML element.
// TypeScript omits it from lib.dom.d.ts as it's deprecated in HTML5, but it
// still works in all browsers and is valid for use in JSX.
import type React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      marquee: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          behavior?: "scroll" | "slide" | "alternate";
          direction?: "left" | "right" | "up" | "down";
          scrollamount?: string | number;
          scrolldelay?: string | number;
          loop?: string | number;
          bgcolor?: string;
          height?: string | number;
          width?: string | number;
          hspace?: string | number;
          vspace?: string | number;
          truespeed?: boolean;
        },
        HTMLElement
      >;
    }
  }
}
