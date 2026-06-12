import apiClient from "./client";


export type InviteUserPayload = {
  email: string;
  name?: string;
  companyName?: string;
};

export type InviteUserResponse = {
  message: string;
  invitedUser: {
    id: number;
    email: string;
    name: string | null;
    hasLoggedIn: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export const inviteUser = async (payload: InviteUserPayload): Promise<InviteUserResponse> => {
  const response = await apiClient.post("/user/invite", payload);
  return response.data;
};