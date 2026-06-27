type TermsTableProps = {
  headers: [string, string];
  rows: [string, string][];
};

export function TermsTable({ headers, rows }: TermsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#F8F9FA]">
            <th className="px-4 py-2.5 font-medium text-[#1C1C1E]">{headers[0]}</th>
            <th className="px-4 py-2.5 font-medium text-[#1C1C1E]">{headers[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value], index) => (
            <tr key={label} className={index % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"}>
              <td className="px-4 py-2.5 text-[#1C1C1E]/80">{label}</td>
              <td className="px-4 py-2.5 text-[#1C1C1E]/80">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
