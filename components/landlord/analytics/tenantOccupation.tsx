"use client";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
// @ts-ignore
const TenantOccupationChart = ({ landlordId }) => {
  const [occupationData, setOccupationData] = useState([]);

  useEffect(() => {
    if (!landlordId) return;

    fetch(`/api/analytics/landlord/getTenantOccupations?landlord_id=${landlordId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // @ts-ignore
          setOccupationData(data);
        } else {
          console.error("Invalid format:", data);
          setOccupationData([]);
        }
      })
      .catch((error) =>
        console.error("Error fetching tenant occupation data:", error)
      );
  }, [landlordId]);

  const labelsOccupation =
    occupationData.length > 0
        // @ts-ignore
      ? occupationData.map((item) => item.occupation || "Unknown")
      : ["No Data"];

  const seriesOccupation =
    occupationData.length > 0
        // @ts-ignore
      ? occupationData.map((item) => item.tenant_count)
      : [0];

  const chartOptionsOccupation = {
    chart: {
      type: "pie",
    },
    labels: labelsOccupation,
    title: {
      text: "Tenant Occupation Distribution",
      align: "center",
    },
    legend: {
      position: "bottom",
    },
    tooltip: {
      y: {
        // @ts-ignore
        formatter: (val, opts) => {
          const occupationName = labelsOccupation[opts.seriesIndex];
          return `${occupationName}: ${val} Tenants`;
        },
      },
    },
    colors: ["#10B981", "#60A5FA", "#FBBF24", "#F87171", "#A78BFA"], // example palette
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Tenant Occupations
      </h3>
      {occupationData.length > 0 ? (
        <Chart
            // @ts-ignore
          options={chartOptionsOccupation}
          series={seriesOccupation}
          type="pie"
          height={350}
        />
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default TenantOccupationChart;
