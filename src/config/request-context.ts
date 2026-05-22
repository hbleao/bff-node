import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
	requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
	run(requestId: string, fn: () => void): void {
		storage.run({ requestId }, fn);
	},
	getRequestId(): string | undefined {
		return storage.getStore()?.requestId;
	},
};
