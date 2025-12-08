// In production, this would use a database
// For now, we'll use a simple in-memory store
export interface UserAccount {
	whop_user_id: string;
	whop_username: string;
	email: string;
	passwordHash: string;
	createdAt: string;
}

export const userAccounts = new Map<string, UserAccount>();


