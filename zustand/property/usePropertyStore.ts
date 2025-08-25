import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

// Define proper types
interface PropertyData {
  propertyName: string;
  propertyType: string;
  amenities: string[];
  street: string;
  brgyDistrict: number;
  city: string;
  zipCode: number;
  province: string;
  propDesc: string;
  floorArea: number;
  utilityBillingType: string;
  minStay: number;
  secDeposit: number;
  advancedPayment: number;
  lateFee: number;
  assocDues: number;
  paymentFrequency: number;
  bedSpacing: number;
  availBeds: number;
  flexiPayEnabled: number;
  paymentMethodsAccepted: string[];
  propertyPreferences: string[];
  lat: number;
  lng: number;
}

interface PropertyStore {
  property: PropertyData;
  photos: any[];
  properties: any[];
  propertyTypes: any[];
  govID: File | null;
  mayorPermit: File | null;
  occPermit: File | null;
  indoorPhoto: File | null;
  outdoorPhoto: File | null;
  propTitle: File | null;
  selectedProperty: any;
  loading: boolean;
  error: string | null;

  setProperty: (propertyDetails: Partial<PropertyData>) => void;
  toggleAmenity: (amenity: string) => void;
  fetchAllProperties: (landlordId: string | number) => Promise<void>;
  updateProperty: (id: string | number, updatedData: any) => void;
  setPhotos: (photos: any[]) => void;
  setMayorPermit: (file: File | null) => void;
  setOccPermit: (file: File | null) => void;
  setIndoorPhoto: (file: File | null) => void;
  setOutdoorPhoto: (file: File | null) => void;
  setGovID: (file: File | null) => void;
  setPropTitle: (file: File | null) => void;
  setSelectedProperty: (property: any) => void;
  reset: () => void;
}

// Initial property state
const initialPropertyState: PropertyData = {
  propertyName: "",
  propertyType: "",
  amenities: [],
  street: "",
  brgyDistrict: 0,
  city: "",
  zipCode: 0,
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

const usePropertyStore = create<PropertyStore>()(
    persist(
        (set, get) => ({
          property: { ...initialPropertyState },
          photos: [],
          properties: [],
          propertyTypes: [],
          govID: null,
          mayorPermit: null,
          occPermit: null,
          indoorPhoto: null,
          outdoorPhoto: null,
          propTitle: null,
          selectedProperty: null,
          loading: false,
          error: null,

          setProperty: (propertyDetails: Partial<PropertyData>) =>
              set((state) => ({
                property: { ...state.property, ...propertyDetails },
              })),

          toggleAmenity: (amenity: string) =>
              set((state) => {
                const amenities = state.property.amenities || [];
                const exists = amenities.includes(amenity);
                return {
                  property: {
                    ...state.property,
                    amenities: exists
                        ? amenities.filter((a) => a !== amenity)
                        : [...amenities, amenity],
                  },
                };
              }),

          fetchAllProperties: async (landlordId) => {
            set({ loading: true, error: null });
            try {
              const [propertiesRes, photosRes] = await Promise.all([
                axios.get(`/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`),
                axios.get("/api/propertyListing/propertyPhotos"),
              ]);

              const propertiesWithPhotos = propertiesRes.data.map((property: any) => {
                const propertyPhoto = photosRes.data.find(
                    (photo: any) => photo.property_id === property.property_id
                );
                return {
                  ...property,
                  photos: propertyPhoto ? [propertyPhoto] : [],
                };
              });

              set({ properties: propertiesWithPhotos, loading: false });
            } catch (err: any) {
              set({ error: err.message, loading: false });
            }
          },

          updateProperty: (id, updatedData) =>
              set((state) => ({
                properties: state.properties.map((p: any) =>
                    p.property_id === id ? { ...p, ...updatedData } : p
                ),
              })),

          setPhotos: (photos) => set({ photos }),
          setMayorPermit: (file) => set({ mayorPermit: file }),
          setOccPermit: (file) => set({ occPermit: file }),
          setIndoorPhoto: (file) => set({ indoorPhoto: file }),
          setOutdoorPhoto: (file) => set({ outdoorPhoto: file }),
          setGovID: (file) => set({ govID: file }),
          setPropTitle: (file) => set({ propTitle: file }),
          setSelectedProperty: (property) => set({ selectedProperty: property }),

          reset: () =>
              set(() => ({
                property: { ...initialPropertyState },
                photos: [],
                mayorPermit: null,
                occPermit: null,
                indoorPhoto: null,
                outdoorPhoto: null,
                govID: null,
                propTitle: null,
              })),
        }),
        {
          name: "property-store", // localStorage key
          partialize: (state) => ({
            property: state.property,
            photos: state.photos,
            properties: state.properties,
            propertyTypes: state.propertyTypes,
            selectedProperty: state.selectedProperty,
            govID: state.govID,
            mayorPermit: state.mayorPermit,
            occPermit: state.occPermit,
            indoorPhoto: state.indoorPhoto,
            outdoorPhoto: state.outdoorPhoto,
            propTitle: state.propTitle,
          }),
        }
    )
);

export default usePropertyStore;
