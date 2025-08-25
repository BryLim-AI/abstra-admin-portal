import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../zustand/authStore";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TenantPropertyChart = () => {
  const { user, fetchSession } = useAuthStore();
  const [billingHistory, setBillingHistory] = useState([]);
  const tenant_id = user?.tenant_id;
  const [billingStatus, setBillingStatus] = useState([]);
  const [meterUsage, setMeterUsage] = useState([]);

  useEffect(() => {
    fetch(
      `/api/analytics/tenant/getMonthlyBillingHistory?tenant_id=${tenant_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setBillingHistory(data.billing_history);
      })
      .catch((error) =>
        console.error("Error fetching billing history:", error)
      );

    fetch(
      `/api/analytics/tenant/getBillingStatusAnalytics?tenant_id=${tenant_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setBillingStatus(data);
      })
      .catch((error) =>
        console.error("Error fetching billing status data:", error)
      );

    fetch(`/api/analytics/tenant/getMeterUsage?tenant_id=${tenant_id}`)
      .then((res) => res.json())
      .then((data) => {
        setMeterUsage(data);
      })
      .catch((error) =>
        console.error("Error fetching meter usage data:", error)
      );
  }, [tenant_id, fetchSession]);

  const labelsUsage = [...new Set(meterUsage.map((item) => item.month))];

  const waterData = labelsUsage.map(
    (month) =>
      meterUsage.find(
        (item) => item.month === month && item.utility_type === "water"
      )?.total_usage || 0
  );

  const electricityData = labelsUsage.map(
    (month) =>
      meterUsage.find(
        (item) => item.month === month && item.utility_type === "electricity"
      )?.total_usage || 0
  );

  const chartOptionsUsage = {
    chart: { type: "line" },
    xaxis: { categories: labelsUsage },
    title: {
      text: "Monthly Water & Electricity Usage for Tenant",
      align: "center",
    },
    tooltip: { y: { formatter: (val) => `${val} kWh/cu.m` } },
  };

  const seriesUsage = [
    { name: "Water (cu.m)", data: waterData },
    { name: "Electricity (kWh)", data: electricityData },
  ];

  const labelsBillingStatus = billingStatus.map((item) => item.month);

  const chartOptionsBillingStatus = {
    chart: { type: "bar", stacked: true },
    xaxis: { categories: labelsBillingStatus },
    title: { text: "Paid vs Unpaid vs Overdue Bills", align: "center" },
    legend: { position: "bottom" },
    tooltip: {
      y: { formatter: (val) => `₱${val.toLocaleString()}` },
    },
  };
  const seriesBillStatus = [
    { name: "Paid", data: billingStatus.map((item) => item.paid_amount) },
    { name: "Unpaid", data: billingStatus.map((item) => item.unpaid_amount) },
    { name: "Overdue", data: billingStatus.map((item) => item.overdue_amount) },
  ];

  const labelsBillingHistory = billingHistory.map((item) => item.month);
  const seriesBillingHistory = [
    {
      name: "Total Billing",
      data: billingHistory.map((item) => item.total_billed_amount),
    },
  ];

  const chartOptionsBilling = {
    chart: { type: "line" },
    xaxis: { categories: labelsBillingHistory },
    title: { text: "Monthly Billing History", align: "center" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-white shadow-md rounded-2xl border border-gray-200">
      <div className="bg-gray-50 p-3 md:p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Billing History
        </h2>
        <div className="h-[250px] md:h-[300px] lg:h-[350px]">
          <Chart
            options={chartOptionsBilling}
            series={seriesBillingHistory}
            type="line"
            height="100%"
            width="100%"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-3 md:p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Billing Status
        </h2>
        <div className="h-[250px] md:h-[300px] lg:h-[350px]">
          <Chart
            options={chartOptionsBillingStatus}
            series={seriesBillStatus}
            type="bar"
            height="100%"
            width="100%"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-3 md:p-4 rounded-lg shadow-sm lg:col-span-2">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Usage Trends
        </h2>
        <div className="h-[250px] md:h-[300px] lg:h-[350px]">
          <Chart
            options={chartOptionsUsage}
            series={seriesUsage}
            type="line"
            height="100%"
            width="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default TenantPropertyChart;
