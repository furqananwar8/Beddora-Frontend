import apiClient from "../client";
export const getUser = async () => {
    const response = await apiClient.get("/auth/me")
    return response.data
};

