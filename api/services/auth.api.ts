import apiClient from "../client";
export const getUser = async () => {
    const response = await apiClient.get("/users/me")
    return response.data
};

