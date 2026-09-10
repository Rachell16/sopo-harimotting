import * as XLSX from "xlsx";

export type SheetExcel = {
  nama: string;
  data: Record<string, string | number>[];
};

// Dipanggil dari browser (client-side), gak perlu server — generate file .xlsx
// terus langsung trigger download ke device yang buka.
export function unduhExcel(namaFile: string, sheets: SheetExcel[]) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.data);
    XLSX.utils.book_append_sheet(wb, ws, s.nama.slice(0, 31)); // nama sheet max 31 karakter
  }
  XLSX.writeFile(wb, `${namaFile}.xlsx`);
}
