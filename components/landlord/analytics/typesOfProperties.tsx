// components/PropertyTypeChart.jsx
"use client";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
// @ts-ignore
const PropertyTypeChart = ({ landlordId }) => {
  const [propertyData, setPropertyData] = useState([]);
console.log('landlord id: ', landlordId);

useEffect(() => {
  if (!landlordId) return;
  fetch(`/api/analytics/landlord/numberOfProperties?landlord_id=${landlordId}`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        // @ts-ignore
          setPropertyData(data);
      } else {
        console.error("Invalid format:", data);
        setPropertyData([]);
      }
    });
}, [landlordId]);


const chartOptions = {
  chart: { type: "bar" },
    // @ts-ignore
  xaxis: { categories: propertyData.map((p) => p.property_type) },
  title: { text: "Properties by Type" },
  colors: ["#4F46E5"],
};



    return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Property Types
      </h3>
      {propertyData.length > 0 ? (
        <Chart
            // @ts-ignore
          options={chartOptions}
            // @ts-ignore
          series={[{ name: "Count", data: propertyData.map((p) => p.count) }]}
          type="bar"
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

export default PropertyTypeChart;
