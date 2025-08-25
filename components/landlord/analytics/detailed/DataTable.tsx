// components/DataTable.tsx
"use client";

interface DataTableProps {
    data: any[];
}

export function DataTable({ data }: DataTableProps) {
    if (!data || data.length === 0) {
        return <div className="text-gray-500 text-sm">No data available</div>;
    }

    const columns = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                <tr>
                    {columns.map((col) => (
                        <th
                            key={col}
                            className="px-4 py-2 border-b border-gray-200 text-left font-semibold text-gray-700"
                        >
                            {col.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {data.map((row, i) => (
                    <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                        {columns.map((col) => (
                            <td
                                key={col}
                                className="px-4 py-2 border-b border-gray-200 text-gray-700"
                            >
                                {row[col]}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
