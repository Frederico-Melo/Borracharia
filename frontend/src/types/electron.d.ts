export {};
declare global {
  interface Window {
    desktop?: { saveReportPdf: (html: string) => Promise<{ canceled: boolean; path?: string }> };
  }
}
