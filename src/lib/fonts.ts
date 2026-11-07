import { Noto_Sans_Ethiopic } from "next/font/google";

const ethiopic = Noto_Sans_Ethiopic({ subsets: ["ethiopic"], variable: "--font-ethiopic", display: "swap" });

export const fontClasses = ethiopic.variable;
