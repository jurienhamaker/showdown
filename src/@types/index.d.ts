export {};

declare global {
	namespace NodeJS {
		export interface Process {
			battlelog: string[];
		}
	}
}