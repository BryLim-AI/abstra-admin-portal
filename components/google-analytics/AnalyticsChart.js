import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";

const AnalyticsChart = () => {
  const [chartData, setChartData] = useState({ categories: [], series: [] });

  useEffect(() => {
    fetch("/pages/api/analytics/googleAnalytics")
      .then((res) => res.json())
      .then((data) => {
        setChartData({
          categories: data.map((item) => item.date),
          series: data.map((item) => item.count),
        });
      })
      .catch((err) => console.error("Error fetching analytics:", err));
  }, []);

  const options = {
    chart: {
      type: "line",
      height: 350,
    },
    xaxis: {
      categories: chartData.categories,
    },
    stroke: {
      curve: "smooth",
    },
    title: {
      text: "Active Users Over the Last 7 Days",
      align: "left",
    },
  };

  return (
    <Chart
      options={options}
      series={[{ name: "Active Users", data: chartData.series }]}
      type="line"
      height={350}
    />
  );
};

export default AnalyticsChart;
