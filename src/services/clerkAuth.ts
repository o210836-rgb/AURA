export interface ClerkUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export const clerkAuthService = {
  async getCurrentUser(user: any): Promise<ClerkUser | null> {
    if (!user) return null;

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      full_name: user.fullName || user.firstName || '',
      avatar_url: user.imageUrl || undefined,
    };
  },
};
