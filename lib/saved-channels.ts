// In-memory storage for saved channels (MVP)
// Replace with database later

export interface SavedChannel {
	channelId: string;
	channelName: string;
	thumbnail: string;
	notes: string;
	savedAt: string;
}

// In-memory store: Map<userId, SavedChannel[]>
const userSavedChannels = new Map<string, SavedChannel[]>();

export function getSavedChannels(userId: string): SavedChannel[] {
	return userSavedChannels.get(userId) || [];
}

export function saveChannel(userId: string, channel: Omit<SavedChannel, "savedAt">): SavedChannel {
	const channels = getSavedChannels(userId);

	// Check if already saved
	const existing = channels.find((c) => c.channelId === channel.channelId);
	if (existing) {
		return existing;
	}

	const newChannel: SavedChannel = {
		...channel,
		savedAt: new Date().toISOString(),
	};

	channels.push(newChannel);
	userSavedChannels.set(userId, channels);

	return newChannel;
}

export function removeChannel(userId: string, channelId: string): boolean {
	const channels = getSavedChannels(userId);
	const filtered = channels.filter((c) => c.channelId !== channelId);

	if (filtered.length === channels.length) {
		return false; // Nothing removed
	}

	userSavedChannels.set(userId, filtered);
	return true;
}

export function updateChannelNotes(
	userId: string,
	channelId: string,
	notes: string
): SavedChannel | null {
	const channels = getSavedChannels(userId);
	const channel = channels.find((c) => c.channelId === channelId);

	if (!channel) {
		return null;
	}

	channel.notes = notes;
	userSavedChannels.set(userId, channels);

	return channel;
}

export function getChannel(userId: string, channelId: string): SavedChannel | null {
	const channels = getSavedChannels(userId);
	return channels.find((c) => c.channelId === channelId) || null;
}
