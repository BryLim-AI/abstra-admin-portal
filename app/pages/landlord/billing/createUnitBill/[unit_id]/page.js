"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import Swal from "sweetalert2";

export default function CreateUnitBill() {
  const { unit_id } = useParams();
  const router = useRouter();
  const [unit, setUnit] = useState(null);
  const [property, setProperty] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    readingDate: "",
    waterPrevReading: "",
    waterCurrentReading: "",
    electricityPrevReading: "",
    electricityCurrentReading: "",
    totalWaterAmount: "",
    totalElectricityAmount: "",
    penaltyAmount: "",
    discountAmount: "",
    totalAmountDue: "",
    rentAmount: "",
    associationDues: "",
    lateFee: "",
    dueDate: "",
  });
  const [propertyRates, setPropertyRates] = useState({
    waterRate: 0,
    electricityRate: 0,
  });
  useEffect(() => {
    if (!unit_id) return;

    async function fetchUnitData() {
      try {
        const res = await axios.get(
          `/api/landlord/billing/getUnitBilling?unit_id=${unit_id}`
        );

        const data = res.data;

        if (!data.unit || !data.property) {
          new Error("Missing unit or property data");
        }
        setUnit(data.unit);
        setProperty(data.property);

        //  Getting Month Rate if Submetered.
        const concessionaireRes = await axios.get(
          `/api/landlord/billing/savePropertyUtilityBillingMonthly?id=${data?.property?.property_id}`
        );

        let concessionaireData = concessionaireRes.data;

        if (!Array.isArray(concessionaireData)) {
          concessionaireData = [];
        }

        let waterRate = 0;
        let electricityRate = 0;

        concessionaireData.forEach((bill) => {
          if (bill.utility_type === "water") {
            waterRate = bill.rate_consumed;
          }
          if (bill.utility_type === "electricity") {
            electricityRate = bill.rate_consumed;
          }
        });
        setPropertyRates({ waterRate, electricityRate });

        setForm((prevForm) => ({
          ...prevForm,
          waterRate,
          electricityRate,
        }));
      } catch (error) {
        console.error("Error fetching unit data:", error);
      }
    }

    fetchUnitData();
  }, [unit_id]);


  const calculateUtilityBill = () => {
    const electricityPrevReading = parseFloat(form.electricityPrevReading) || 0;
    const electricityCurrentReading =
      parseFloat(form.electricityCurrentReading) || 0;
    const waterPrevReading = parseFloat(form.waterPrevReading) || 0;
    const waterCurrentReading = parseFloat(form.waterCurrentReading) || 0;

    //  property-wide rates
    const electricityRate = parseFloat(propertyRates.electricityRate) || 0;
    const waterRate = parseFloat(propertyRates.waterRate) || 0;

    // Calculate usage
    const electricityUsage = Math.max(
      0,
      electricityCurrentReading - electricityPrevReading
    );
    const waterUsage = Math.max(0, waterCurrentReading - waterPrevReading);

    // Calculate cost using rates
    const electricityCost = electricityUsage * electricityRate;
    const waterCost = waterUsage * waterRate;

    // Other costs
    const rentAmount = parseFloat(unit?.rent_amount) || 0;
    const associationDues = parseFloat(property?.assoc_dues) || 0;
    const lateFee = parseFloat(property?.late_fee) || 0;

    const penaltyAmount = parseFloat(form.penaltyAmount) || 0;
    const discountAmount = parseFloat(form.discountAmount) || 0;

    const subtotal = electricityCost + waterCost + rentAmount + associationDues;

    // Compute total with late fee, penalty, and discount
    const total = subtotal + lateFee + penaltyAmount - discountAmount;

    return {
      electricity: {
        usage: electricityUsage,
        rate: electricityRate.toFixed(2),
        cost: electricityCost.toFixed(2),
      },
      water: {
        usage: waterUsage,
        rate: waterRate.toFixed(2),
        cost: waterCost.toFixed(2),
      },
      rentAmount: rentAmount.toFixed(2),
      associationDues: associationDues.toFixed(2),
      lateFee: lateFee.toFixed(2),
      penaltyAmount: penaltyAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  if (!unit || !property) return <p>Loading...</p>;

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.dueDate) {
      Swal.fire({
        icon: "warning",
        title: "Missing Due Date",
        text: "Please select a due date before submitting.",
      });
      return;
    }

    try {
      const billingData = {
        readingDate: form.readingDate,
        totalWaterAmount: parseFloat(calculateUtilityBill().water.cost) || 0,
        totalElectricityAmount:
          parseFloat(calculateUtilityBill().electricity.cost) || 0,
        penaltyAmount: parseFloat(form.penaltyAmount) || 0,
        discountAmount: parseFloat(form.discountAmount) || 0,
        dueDate: form.dueDate,
        unit_id: unit.unit_id,
        waterPrevReading: form.waterPrevReading,
        waterCurrentReading: form.waterCurrentReading,
        electricityPrevReading: form.electricityPrevReading,
        electricityCurrentReading: form.electricityCurrentReading,
        total_amount_due: parseFloat(calculateUtilityBill().total),
      };

      const res = await axios.post("/api/landlord/billing/createUnitMonthlyBilling", billingData);

      if (res.status === 201) {
        Swal.fire({
          title: "Success!",
          text: "Billing saved successfully!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          router.push(
            `/pages/landlord/property-listing/view-unit/${property.property_id}`
          );
        });
        setForm({
          readingDate: "",
          waterPrevReading: "",
          waterCurrentReading: "",
          electricityPrevReading: "",
          electricityCurrentReading: "",
          totalWaterAmount: "",
          totalElectricityAmount: "",
          penaltyAmount: "",
          discountAmount: "",
          totalAmountDue: "",
          rentAmount: "",
          associationDues: "",
          lateFee: "",
          dueDate: "",
        });
      }
    } catch (error) {
      console.error("Error saving billing:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to save billing.",
      });
    }
  };

  return (
    <LandlordLayout>
      <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {property?.property_name} Unit {unit?.unit_name} - Billing
        </h1>

        {/* Show Billing Rates */}
        <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
          <h2 className="text-lg font-semibold flex justify-between items-center mb-3 text-gray-700">
            Property Rate
            <span className="text-gray-500 text-sm font-medium px-3 py-1 bg-gray-100 rounded-full">
              {new Date().toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </span>
              <p className="text-gray-600">
                Water Rate:{" "}
                <span className="font-medium text-gray-800">
                  ₱{propertyRates?.waterRate}
                </span>{" "}
                per m³
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </span>
              <p className="text-gray-600">
                Electricity Rate:{" "}
                <span className="font-medium text-gray-800">
                  ₱{propertyRates?.electricityRate}
                </span>{" "}
                per kWh
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-step Billing Form */}
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Create New Bill
              <span className="ml-2 text-sm font-medium text-gray-500">
                Step {step} of 3
              </span>
            </h2>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="p-5">
            {/* Step 1: Meter Readings */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 border border-blue-100">
                  {property.utility_billing_type === "submetered"
                    ? "Enter meter readings for water and electricity."
                    : property.utility_billing_type === "included"
                    ? "Utility costs are included in rent. Only total amounts are needed."
                    : "No meter readings needed for this billing type."}
                </div>

                {/* Reading Date Input */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reading Date
                  </label>
                  <input
                    type="date"
                    name="readingDate"
                    placeholder="Reading Date"
                    value={form.readingDate}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {property.utility_billing_type === "submetered" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-4 p-4 rounded-lg border border-blue-100 bg-blue-50">
                      <h3 className="font-medium text-blue-800">
                        Water Meter Readings
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Previous Water Meter Reading
                        </label>
                        <input
                              type="number"
                              name="waterPrevReading"
                              placeholder="Previous Water Reading"
                              value={form.waterPrevReading}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 6) {
                                  handleChange(e);
                                }
                              }}
                              min="0"
                              max="999999"
                              className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Water Meter Reading
                        </label>
                        <input
                          type="number"
                          name="waterCurrentReading"
                          placeholder="Current Water Reading"
                          value={form.waterCurrentReading}
                         onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 6) {
                                  handleChange(e);
                                }
                              }}
                              min="0"
                              max="999999"
                          className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-4 rounded-lg border border-yellow-100 bg-yellow-50">
                      <h3 className="font-medium text-yellow-800">
                        Electricity Meter Readings
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Previous Electricity Meter Reading
                        </label>
                        <input
                          type="number"
                          name="electricityPrevReading"
                          placeholder="Previous Electricity Reading"
                          value={form.electricityPrevReading}
                          onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 5) {
                                  handleChange(e);
                                }
                              }}
                              min="0"
                              max="99999"
                          className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Electricity Meter Reading
                        </label>
                        <input
                          type="number"
                          name="electricityCurrentReading"
                          placeholder="Current Electricity Reading"
                          value={form.electricityCurrentReading}
                           onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 5) {
                                  handleChange(e);
                                }
                              }}
                              min="0"
                              max="99999"
                          className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {property.utility_billing_type === "provider" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Water Amount
                      </label>
                      <input
                        type="number"
                        name="totalWaterAmount"
                        placeholder="Total Water Amount"
                        value={form.totalWaterAmount}
                        onChange={handleChange}
                        className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Electricity Amount
                      </label>
                      <input
                        type="number"
                        name="totalElectricityAmount"
                        placeholder="Total Electricity Amount"
                        value={form.totalElectricityAmount}
                        onChange={handleChange}
                        className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Rent, Late Fees, and Dues */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 border border-blue-100">
                  Enter payment due date and review additional charges.
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    placeholder="Due Date"
                    value={form.dueDate}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <h3 className="font-medium text-gray-800">Fixed Charges</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rent Amount
                      </label>
                      <input
                        type="number"
                        name="rentAmount"
                        placeholder="Rent Amount"
                        value={unit?.rent_amount}
                        disabled
                        className="px-3 py-2 border border-gray-200 rounded-md w-full bg-gray-100 text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Association Dues
                      </label>
                      <input
                        type="number"
                        name="assoc_dues"
                        placeholder="Association Dues"
                        value={property.assoc_dues}
                        disabled
                        className="px-3 py-2 border border-gray-200 rounded-md w-full bg-gray-100 text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Late Fee
                      </label>
                      <input
                        type="number"
                        name="lateFee"
                        placeholder="Late Fee"
                        value={property.late_fee}
                        disabled
                        className="px-3 py-2 border border-gray-200 rounded-md w-full bg-gray-100 text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <h3 className="font-medium text-gray-800">Adjustments</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount
                      </label>
                      <input
                        type="number"
                        name="discountAmount"
                        placeholder="Discount"
                        value={form.discountAmount}
                        onChange={handleChange}
                        className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Penalties
                      </label>
                      <input
                        type="number"
                        name="penaltyAmount"
                        placeholder="Penalties"
                        value={form.penaltyAmount}
                        onChange={handleChange}
                        className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Final Computation */}
            {step === 3 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Invoice Summary
                </h3>

                <div className="rounded-lg overflow-hidden shadow-md">
                  <div className="bg-blue-600 text-white py-4 px-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Reading Date:</h4>
                      <p className="font-semibold">
                        {form.readingDate || "N/A"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <h4 className="font-medium">Due Date:</h4>
                      <p className="font-semibold">{form.dueDate || "N/A"}</p>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {/* Electricity */}
                    <div className="p-5 bg-white">
                      <div className="flex items-center mb-3">
                        <span className="text-yellow-500 mr-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </span>
                        <h4 className="text-lg font-semibold text-gray-800">
                          Electricity Charges
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-600">Usage:</p>
                        <p className="text-right font-medium">
                          {calculateUtilityBill().electricity.usage} kWh
                        </p>
                        <p className="text-gray-600">Rate per kWh:</p>
                        <p className="text-right font-medium">
                          ₱{calculateUtilityBill().electricity.rate}
                        </p>
                        <p className="text-gray-800 font-semibold">
                          Total Cost:
                        </p>
                        <p className="text-right font-bold text-yellow-600">
                          ₱{calculateUtilityBill().electricity.cost}
                        </p>
                      </div>
                    </div>

                    {/* Water */}
                    <div className="p-5 bg-white">
                      <div className="flex items-center mb-3">
                        <span className="text-blue-500 mr-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </span>
                        <h4 className="text-lg font-semibold text-gray-800">
                          Water Charges
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-600">Usage:</p>
                        <p className="text-right font-medium">
                          {calculateUtilityBill().water.usage} m³
                        </p>
                        <p className="text-gray-600">Rate per m³:</p>
                        <p className="text-right font-medium">
                          ₱{calculateUtilityBill().water.rate}
                        </p>
                        <p className="text-gray-800 font-semibold">
                          Total Cost:
                        </p>
                        <p className="text-right font-bold text-blue-600">
                          ₱{calculateUtilityBill().water.cost}
                        </p>
                      </div>
                    </div>

                    {/* Other Charges */}
                    <div className="p-5 bg-white">
                      <div className="flex items-center mb-3">
                        <span className="text-gray-500 mr-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </span>
                        <h4 className="text-lg font-semibold text-gray-800">
                          Additional Charges
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-600">Rent Amount:</p>
                        <p className="text-right font-medium">
                          ₱{unit?.rent_amount}
                        </p>
                        <p className="text-gray-600">Association Dues:</p>
                        <p className="text-right font-medium">
                          ₱{calculateUtilityBill().associationDues}
                        </p>
                        <p className="text-gray-600">Late Fee:</p>
                        <p className="text-right font-medium">
                          ₱{calculateUtilityBill().lateFee}
                        </p>
                        <p className="text-gray-600">Discount:</p>
                        <p className="text-right font-medium text-green-600">
                          -₱{calculateUtilityBill().discountAmount}
                        </p>
                        <p className="text-gray-600">Penalties:</p>
                        <p className="text-right font-medium text-red-600">
                          ₱{calculateUtilityBill().penaltyAmount}
                        </p>
                      </div>
                    </div>

                    {/* Total Due */}
                    <div className="p-5 bg-gray-800 text-white">
                      <div className="flex justify-between items-center text-lg">
                        <p className="font-bold">Total Amount Due:</p>
                        <p className="font-bold text-xl">
                          ₱{calculateUtilityBill().total}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              {step > 1 ? (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </span>
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="flex items-center">
                    Next
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={handleSubmit}
                >
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Submit Bill
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
