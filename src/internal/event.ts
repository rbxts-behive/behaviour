// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function event<Params extends unknown[]>(): BindableEvent<(...args: Params) => void> {
	return new Instance('BindableEvent')
}
