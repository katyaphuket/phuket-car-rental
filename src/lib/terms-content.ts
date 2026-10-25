import type { Locale } from "./dictionary";
import terms from "../../knowledge/terms.json";

type TermsContent = {
  legalTag: string;
  heading: string;
  subheading: string;
  included: { title: string; intro: string; items: string[] };
  driver: {
    title: string;
    age: string;
    experience: string;
    licenseIntro: string;
    option1Title: string;
    option1Text: string;
    option2Title: string;
    option2Text: string;
    warning: string;
    noLicenseNote: string;
  };
  delivery: {
    title: string;
    intro: string;
    tableHeaders: [string, string];
    rows: [string, string][];
    note: string;
  };
  minTerm: {
    title: string;
    intro: string;
    economyTitle: string;
    economyRows: [string, string][];
    crossoverTitle: string;
    crossoverRows: [string, string][];
    tableHeaders: [string, string];
    note: string;
  };
  payment: { title: string; intro: string; items: string[] };
  deposit: {
    title: string;
    intro: string;
    accidentTitle: string;
    accidentItems: string[];
    amountNote: string;
    cashNote: string;
    photoNote: string;
  };
  insurance: {
    title: string;
    intro: string;
    exclusionsTitle: string;
    exclusions: string[];
    callNote: string;
  };
  mileage: { title: string; items: string[] };
  returning: { title: string; text: string };
  important: {
    title: string;
    fuelTitle: string;
    fuelText: string;
    batteryTitle: string;
    batteryText: string;
    cleanTitle: string;
    cleanText: string;
    thirdPartyTitle: string;
    thirdPartyText: string;
    parkingTitle: string;
    parkingText: string;
    earlyReturnTitle: string;
    earlyReturnText: string;
    inspectionTitle: string;
    inspectionText: string;
  };
  cta: { title: string; subtitle: string; whatsapp: string; telegram: string };
  legalFooter: string;
};

// Тексты правил аренды — в knowledge/terms.json
export const termsContent = terms as Record<Locale, TermsContent>;
