import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../zustand/authStore";
import LoadingScreen from "../loadingScreen";
const PropertyTypeChart = dynamic(() => import("../landlord/analytics/typesOfProperties"), { ssr: false });
const TenantOccupationChart = dynamic(() => import("../landlord/analytics/tenantOccupation"), { ssr: false });
const ScoreCard = dynamic(() => import("../landlord/analytics/scoreCards"), { ssr: false });
const PropertyUtilitiesChart = dynamic(() => import("../landlord/analytics/propertyUtilityRates"), { ssr: false });
const MaintenanceCategoriesChart = dynamic(() => import("../landlord/analytics/getMaintenanceCategory"), { ssr: false });
const PaymentsPerMonthChart = dynamic(() => import("../landlord/analytics/MonthlyPaymentsChart"), { ssr: false });
const UtilityTrendsChart = dynamic(() => import("../landlord/analytics/utilityTrend"), { ssr: false });
const RevenuePerformanceChart = dynamic(() => import("../landlord/analytics/revenuePerformance"), { ssr: false });
const UpcomingVisitsWidget = dynamic(() => import("../landlord/properties/propertyVisit"), { ssr: false });
const TaskWidget = dynamic(() => import("../landlord/widgets/taskToDo"), { ssr: false });

import Link from "next/link";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <p>Loading Chart...</p>,
});

const LandlordPropertyChart = () => {
  const { user, fetchSession } = useAuthStore();

  const [monthlyVisits, setMonthlyVisits] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalUnits, setTotalUnits] = useState(0);
  const [data, setData] = useState([]);
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalReceivables, setTotalReceivables] = useState(0);

  useEffect(() => {
    if (!user?.landlord_id) {
      fetchSession();
    }
  }, [user, fetchSession]);

  const landlord_id = user?.landlord_id;

  useEffect(() => {
    if (!user?.landlord_id) return;

    fetch(
      `/api/analytics/landlord/propertyVisitsPerMonth?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setMonthlyVisits(data.visitsPerMonth || []);
      })
      .catch((error) => console.error("Error fetching visit data:", error));

    fetch(
      `/api/analytics/landlord/occupancyRateProperty?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        const total = data.occupancyRate?.total_units || 0;
        const rate = total > 0 ? data.occupancyRate?.occupancy_rate || 0 : 0;

        setTotalUnits(total);
        setOccupancyRate(rate);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching occupancy rate data:", error);
        setLoading(false);
      });


    fetch(
      `/api/analytics/landlord/getTotalTenants?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Total Tenants:", data?.total_tenants);
        setTotalTenants(data.total_tenants);
      })
      .catch((error) => console.error("Error fetching total tenants:", error));

    fetch(
      `/api/analytics/landlord/getNumberofTotalMaintenance?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Total Maintenance Requests:", data?.total_requests);
        setTotalRequests(data?.total_requests);
      })
      .catch((error) =>
        console.error("Error fetching maintenance request count:", error)
      );

    fetch(
      `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Total Receivables:", data?.total_receivables);
        setTotalReceivables(data?.total_receivables);
      })
      .catch((error) =>
        console.error("Error fetching total receivables:", error)
      );

  }, [fetchSession, user]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // if (!user?.landlord_id) {
  //   return <LoadingScreen />; // Or return null while waiting
  // }
  // Ensure `monthlyVisits` is always an array before mapping
  const visitData = (monthlyVisits || []).map((item) => ({
    month: months[item.month - 1],
    visitCount: item.visitCount,
  }));

  const chartOptionsVisits = {
    chart: { type: "bar" },
    xaxis: { categories: visitData.map((item) => item.month) },
    title: { text: "Property Visits Request Per Month" },
    colors: ["#6A0DAD"],
  };

  const chartOptionsOccupancy = {
    chart: {
      type: "radialBar",
    },
    plotOptions: {
      radialBar: {
        hollow: { size: "60%" },
        dataLabels: {
          show: true,
          name: { show: false },
          value: {
            fontSize: "22px",
            fontWeight: "bold",
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    labels: ["Occupancy Rate of All Properties"],
  };
  const chartSeries = [occupancyRate];

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      {loading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
            <LoadingScreen />
          </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

            <ScoreCard
                title="Upcoming payments"
                value={totalReceivables}
                borderColor="red"
            />

            <ScoreCard
                title="Pending Maintenance Request"
                value={totalRequests}
                borderColor="red"
            />

           <ScoreCard
              title="Total Active Tenants"
              value={totalTenants}
              borderColor="green"
            />

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenuePerformanceChart landlordId={landlord_id} />
            <TaskWidget landlordId={user?.landlord_id} />
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UpcomingVisitsWidget landlordId={landlord_id} />
          </div>


          {/*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">*/}
          {/*  <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">*/}
          {/*    <TenantOccupationChart landlordId={landlord_id} />*/}
          {/*  </div>*/}

          {/*  <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">*/}
          {/*    <PropertyUtilitiesChart landlordId={landlord_id} />*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">*/}
          {/*  <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">*/}
          {/*    <PropertyUtilitiesChart landlordId={landlord_id} />*/}
          {/*  </div>*/}

          {/*  <Link*/}
          {/*      href={`/pages/landlord/analytics/detailed/utility-trends?landlord_id=${landlord_id}`}*/}
          {/*      className="block"*/}
          {/*  >*/}
          {/*    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">*/}
          {/*      <UtilityTrendsChart landlordId={landlord_id} />*/}
          {/*    </div>*/}
          {/*  </Link>*/}
          {/*</div>*/}

          {/*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">*/}
          {/*  <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">*/}
          {/*    <h3 className="text-lg font-semibold text-gray-700 mb-3">*/}
          {/*      Property Visits*/}
          {/*    </h3>*/}
          {/*    {visitData.length > 0 ? (*/}
          {/*      <Chart*/}
          {/*        options={chartOptionsVisits}*/}
          {/*        series={[*/}
          {/*          {*/}
          {/*            name: "Visits",*/}
          {/*            data: visitData.map((item) => item.visitCount),*/}
          {/*          },*/}
          {/*        ]}*/}
          {/*        type="bar"*/}
          {/*        height={350}*/}
          {/*      />*/}
          {/*    ) : (*/}
          {/*      <div className="flex justify-center items-center h-64">*/}
          {/*        <p className="text-gray-500">No data available</p>*/}
          {/*      </div>*/}
          {/*    )}*/}
          {/*  </div>*/}

          {/*  <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">*/}
          {/*    <h3 className="text-lg font-semibold text-gray-700 mb-3">*/}
          {/*      Occupancy Rate Overall Property*/}
          {/*    </h3>*/}
          {/*    {loading ? (*/}
          {/*      <div className="flex justify-center items-center h-64">*/}
          {/*        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>*/}
          {/*      </div>*/}
          {/*    ) : totalUnits > 0 ? (*/}
          {/*      <Chart*/}
          {/*        options={chartOptionsOccupancy}*/}
          {/*        series={chartSeries}*/}
          {/*        type="radialBar"*/}
          {/*        height={250}*/}
          {/*      />*/}
          {/*    ) : (*/}
          {/*      <div className="flex justify-center items-center h-64">*/}
          {/*        <p className="text-gray-500">No data available</p>*/}
          {/*      </div>*/}
          {/*    )}*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">*/}
          {/*  <MaintenanceCategoriesChart landlordId={landlord_id} />*/}
          {/*  <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">*/}
          {/*      <PaymentsPerMonthChart landlordId={landlord_id}/>*/}
          {/*  </div>*/}
          {/*</div>*/}




        </>
      )}
    </div>
  );
};

export default LandlordPropertyChart;
