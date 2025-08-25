import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";

const ActiveUsersChart = () => {
  const [chartData, setChartData] = useState({ categories: [], series: [] });

  useEffect(() => {
    fetch("/pages/api/analytics/getActiveUsers")
      .then((res) => res.json())
      .then((data) => {
        setChartData({
          categories: data.map((item) => item.minute),
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
      title: { text: "Minute of the Current Hour" },
    },
    yaxis: {
      title: { text: "Active Users" },
    },
    stroke: {
      curve: "smooth",
    },
    title: {
      text: "Real-Time Active Users (Last Hour)",
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

export default ActiveUsersChart;
