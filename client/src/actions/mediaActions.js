import api from "@src/utils/axiosSetup";

export const getSliderBanners = async () => {
  try {
    const config = { headers: { "Content-Type": "application/json" } };
    const res = await api.get(`/api/common/slider-banners`, config);
    return res.data && res.data.status === true ? res.data.response : [];
  } catch (err) {
    console.error("Error fetching slider banners:", err);
    return [];
  }
};

export const getGalleryImages = async (category = "") => {
  try {
    const config = {
      headers: { "Content-Type": "application/json" },
      params: category ? { category } : {},
    };
    const res = await api.get(`/api/common/gallery`, config);
    return res.data && res.data.status === true ? res.data.response : [];
  } catch (err) {
    console.error("Error fetching gallery images:", err);
    return [];
  }
};
