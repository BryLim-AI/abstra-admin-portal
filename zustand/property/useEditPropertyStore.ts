import { create } from "zustand";

const initialEditPropertyState = {
    propertyName: "",
    propertyType: "",
    amenities: [],
    street: "",
    brgyDistrict: "",
    city: "",
    zipCode: "",
    province: "",
    propDesc: "",
    floorArea: 0,
    utilityBillingType: "",
    minStay: 0,
    secDeposit: 0,
    advancedPayment: 0,
    lateFee: 0,
    assocDues: 0,
    paymentFrequency: 0,
    bedSpacing: 0,
    availBeds: 0,
    flexiPayEnabled: 0,
    paymentMethodsAccepted: [],
    propertyPreferences: [],
    lat: 0,
    lng: 0,
};

// @ts-ignore
const useEditPropertyStore = create((set) => ({
    property: { ...initialEditPropertyState },
    photos: [],
    loading: false,
    error: null,

    // Set or merge property fields
    // @ts-ignore
    setProperty: (propertyDetails) =>
        // @ts-ignore
        set((state) => ({
            property: {
                ...state.property,
                ...propertyDetails,
            },
        })),

    // Toggle an amenity
    // @ts-ignore
    toggleAmenity: (amenity) =>
        // @ts-ignore
        set((state) => {
            const amenities = state.property.amenities || [];
            const exists = amenities.includes(amenity);
            return {
                property: {
                    ...state.property,
                    amenities: exists
                        // @ts-ignore
                        ? amenities.filter((a) => a !== amenity)
                        : [...amenities, amenity],
                },
            };
        }),

    // Set photos/files individually
    // @ts-ignore
    setPhotos: (photos) => set({ photos }),

    reset: () =>
        set(() => ({
            property: { ...initialEditPropertyState },
            photos: [],
            loading: false,
            error: null,
        })),
}));

export default useEditPropertyStore;
