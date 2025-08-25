import axios from "axios";

export const fetchAllProperties = async (
  landlordId: number,
  set: any,
  propertyId?: number
) => {
  set({ loading: true, error: null });

  try {
    const [propertiesRes, photosRes] = await Promise.all([
      axios.get(`/api/propertyListing/getPropertyperLandlord?landlord_id=${landlordId}`),
      axios.get(`/api/propertyListing/propertyPhotos${propertyId ? `?property_id=${propertyId}` : ""}`)
    ]);

    const properties = propertiesRes?.data?.data || propertiesRes?.data || [];

    const propertiesWithPhotos = properties.map((property: any) => {
      const matchedPhotos = photosRes.data?.filter(
        (photo: any) => photo.property_id === property.property_id
      ) || [];

      return {
        ...property,
        photos: matchedPhotos,
      };
    });

    set({
      properties: propertiesWithPhotos,
      loading: false,
    });
  } catch (err: any) {
    console.error("Failed to fetch properties:", err);
    set({
      error: err.response?.data?.error || err.message || "Failed to load properties",
      loading: false,
    });
  }
};
