export function resolveValue<T, Params extends unknown[]>(input: ValueOrCallback<T, Params>, ...params: Params) {
	return typeIs(input, 'function') ? input(...params) : input
}

export type ValueOrCallback<T, Params extends unknown[]> = T | ((...params: Params) => T)
