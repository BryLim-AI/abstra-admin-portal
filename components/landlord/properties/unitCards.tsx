import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  KeyIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import PaymentStatus from '../../tenant/currentRent/advPaymentStatus';
import { getStatusColor, formatAddress } from '@/lib/utils';

interface UnitCardProps {
  unit: any;
  requiresSecurity: boolean;
  requiresAdvanced: boolean;
  pendingSecurity: boolean;
  pendingAdvanced: boolean;
  isSecurityPaid: boolean;
  isAdvancedPaid: boolean;
  selectedItems: {
    security_deposit: boolean;
    advance_rent: boolean;
  };
  handleCheckboxChange: (item: string) => void;
  itemsToPay: { name: string }[];
  totalAmount: number;
  canPayViaMaya: boolean;
  loadingPayment: boolean;
  handlePayment: () => void;
  allPaymentsMade: boolean;
  handleAccessRentPortal: () => void;
  handleContactLandlord: () => void;
}

export default function UnitCard({
  unit,
  requiresSecurity,
  requiresAdvanced,
  pendingSecurity,
  pendingAdvanced,
  isSecurityPaid,
  isAdvancedPaid,
  selectedItems,
  handleCheckboxChange,
  itemsToPay,
  totalAmount,
  canPayViaMaya,
  loadingPayment,
  handlePayment,
  handleContactLandlord,
}: UnitCardProps) {
  const router = useRouter();

  //  Access portal base on rents agreements
  const handleAccessRentPortal = () => {
    if (!unit?.agreement_id) return;
    router.push(`/pages/tenant/rentalPortal/${unit.agreement_id}`);
  };

const unitRequiresSecurity = Number(unit.sec_deposit) > 0;
const unitRequiresAdvanced = Number(unit.advanced_payment) > 0;
const unitPaidSecurity = unit.is_security_deposit_paid;
const unitPaidAdvance = unit.is_advance_payment_paid;


const allPaymentsMade =
  (!unitRequiresSecurity || unitPaidSecurity) &&
  (!unitRequiresAdvanced || unitPaidAdvance);

console.log('all payment made: ', allPaymentsMade);

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      <div className="relative h-56 sm:h-72 w-full">
        {unit.unit_photos && unit.unit_photos.length > 0 ? (
          <Image
            src={unit.unit_photos[0]}
            alt={`${unit.property_name} - Unit ${unit.unit_name}`}
            layout="fill"
            objectFit="cover"
            className="brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-indigo-800" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                  unit.status
                )}`}
              >
                {unit?.status || 'Status'}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                {unit?.property_type
                  ? unit.property_type.charAt(0).toUpperCase() + unit.property_type.slice(1).toLowerCase()
                  : 'Property Type'}
              </span>
            </div>
            <h2 className="text-2xl font-bold">
              {unit?.property_name} - Unit {unit.unit_name}
            </h2>
            <div className="flex items-center mt-2 text-white/90">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <p className="text-sm">{formatAddress(unit)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Unit Details</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Size</p>
              <p className="font-medium">{unit.unit_size || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Furnishing</p>
              <p className="font-medium">
                {unit.furnish?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Not furnished'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Minimum Stay</p>
              <p className="font-medium">{unit.min_stay || 'N/A'} month(s)</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">

              <div className="flex items-center mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-indigo-500 mr-2" />
                <p className="text-sm text-gray-500">Monthly Rent</p>
              </div>
              <p className="text-xl font-bold text-indigo-600">
                ₱{Number(unit.rent_amount || 0).toLocaleString()}
              </p>
                <div className="flex items-center mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-indigo-500 mr-2" />
                <p className="text-sm text-gray-500">Security Deposit</p>
              </div>

            </div>

            {requiresSecurity && (
              <div className={`rounded-lg p-4 border ${pendingSecurity ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center mb-2">
                  <KeyIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  <p className="text-sm text-gray-500">Security Deposit</p>
                </div>
                <p className="text-xl font-bold text-indigo-600">
                  ₱{Number(unit.sec_deposit || 0).toLocaleString()}
                </p>
                <PaymentStatus isPaid={isSecurityPaid} label="Status" />
                {pendingSecurity && (
                  <div className="mt-3 flex items-center">
                    <input
                      id="select_security_deposit"
                      type="checkbox"
                      checked={selectedItems.security_deposit}
                      onChange={() => handleCheckboxChange('security_deposit')}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="select_security_deposit" className="ml-2 block text-sm text-gray-900">
                      Select to Pay
                    </label>
                  </div>
                )}
              </div>
            )}

            {requiresAdvanced && (
              <div className={`rounded-lg p-4 border ${pendingAdvanced ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center mb-2">
                  <CreditCardIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  <p className="text-sm text-gray-500">Advance Payment</p>
                </div>
                <p className="text-xl font-bold text-indigo-600">
                  ₱{Number(unit.advanced_payment || 0).toLocaleString()}
                </p>
                <PaymentStatus isPaid={isAdvancedPaid} label="Status" />
                {pendingAdvanced && (
                  <div className="mt-3 flex items-center">
                    <input
                      id="select_advance_rent"
                      type="checkbox"
                      checked={selectedItems.advance_rent}
                      onChange={() => handleCheckboxChange('advance_rent')}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="select_advance_rent" className="ml-2 block text-sm text-gray-900">
                      Select to Pay
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {canPayViaMaya && !allPaymentsMade && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Pay through Maya</h3>
            <button
              onClick={handlePayment}
              // disabled={loadingPayment || itemsToPay.length == 0}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-lg shadow-md transition-all transform hover:scale-[1.01] ${
                itemsToPay.length === 0 || loadingPayment
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800'
              }`}
            >
              <div className="flex items-center flex-1">
                <CreditCardIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Pay Security Deposit and Advance Rent</p>
                  <p className="text-xs text-indigo-200">
                    {itemsToPay.length > 0 ? itemsToPay.map((i) => i.name).join(' & ') : 'Select items above'}
                  </p>
                </div>
              </div>
              {itemsToPay.length > 0 && (
                <div className="flex items-center flex-shrink-0 ml-4">
                  <span className="font-bold mr-2">₱{totalAmount.toLocaleString()}</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </div>
              )}
            </button>
          </div>
        )}

        {(pendingSecurity || pendingAdvanced) && !allPaymentsMade && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">Other Payment Option</h3>
            <button
              onClick={() => router.push(`/pages/payment/proofOfPayment?agreement_id=${unit.agreement_id}`)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-700 transition-all transform hover:scale-[1.01]"
            >
              <div className="flex items-center flex-1">
                <BuildingOfficeIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Upload Proof of Payment</p>
                  <p className="text-xs text-cyan-100">Gcash, PDC, Bank Transfer</p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <ArrowRightIcon className="h-5 w-5" />
              </div>
            </button>
          </div>
        )}

        {allPaymentsMade && (
          <button
            onClick={handleAccessRentPortal}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.01]"
          >
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 mr-3" />
              <div className="text-left">
                <p className="font-medium">Access Rent Portal</p>
                <p className="text-xs text-green-200">Manage your monthly payments</p>
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        )}


        <div className="md:hidden">
          <button
            onClick={handleContactLandlord}
            className="w-full flex items-center justify-center gap-2 py-3 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span>Contact Landlord</span>
          </button>
        </div>
      </div>
    </div>
  );
}
