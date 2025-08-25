import usePropertyStore from "../../zustand/property/usePropertyStore";
import { PAYMENT_FREQUENCIES } from "../../constant/paymentFrequency"; 
import { PAYMENT_METHODS } from "../../constant/paymentMethods"; 

export function StepFour() {
  const { property, setProperty } = usePropertyStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
  };

  const handleCheckboxChange = (method) => {
    const accepted = property.paymentMethodsAccepted || [];
    const newList = accepted.includes(method)
      ? accepted.filter((m) => m !== method)
      : [...accepted, method];

    setProperty({ ...property, paymentMethodsAccepted: newList });
  };


  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-2">Property Payment Methods</h2>

      <div>
        <label
          htmlFor="lateFee"
          className="block text-sm font-medium text-gray-700"
        >
          Late Fee (%)
        </label>
        <input
          id="lateFee"
          name="lateFee"
          type="number"
          placeholder="5"
          min={0}
          className="mt-1 block w-full rounded-md border p-3"
          value={property.lateFee || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <label
          htmlFor="assocDues"
          className="block text-sm font-medium text-gray-700"
        >
          Association Dues
        </label>
        <input
          id="assocDues"
          name="assocDues"
          type="number"
          placeholder="0"
          min={0}
          className="mt-1 block w-full rounded-md border p-3"
          value={property.assocDues || ""}
          onChange={handleChange}
        />
      </div>

      <div>
        <label
          htmlFor="paymentFrequency"
          className="block text-sm font-medium text-gray-700"
        >
          Payment Frequency
        </label>
        <select
          id="paymentFrequency"
          name="paymentFrequency"
          value={property.paymentFrequency || ""}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border p-3"
        >
          <option value="" disabled>
            Select Payment Frequency
          </option>
          {PAYMENT_FREQUENCIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>


    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Methods Accepted
        </label>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((method) => (
            <label key={method.key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={(property.paymentMethodsAccepted || []).includes(method.key)}
                onChange={() => handleCheckboxChange(method.key)}
                className="h-4 w-4"
              />
              <span>{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
  <label className="flex items-start gap-3 mt-4">
    <input
      type="checkbox"
      checked={property.flexiPayEnabled || false}
      onChange={(e) =>
        setProperty({ ...property, flexiPayEnabled: e.target.checked })
      }
      className="mt-1"
    />
    <span>
      <span className="font-medium text-gray-800">Allow FlexiPay Payment?</span>
      <p className="text-sm text-gray-600">
        FlexiPay allows tenants to make partial payments until the due date.
      </p>
    </span>
  </label>
</div>





    </div>
  );
}
